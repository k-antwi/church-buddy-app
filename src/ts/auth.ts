const DEFAULT_API_BASE = (import.meta.env.VITE_API_BASE_URL as string).replace(/\/$/, '');
const TENANT_BASE_DOMAIN = ((import.meta.env.VITE_TENANT_BASE_DOMAIN as string | undefined) ?? 'churchpanel.org').replace(/^\./, '');

const TOKEN_KEY   = 'cp_access_token';
const EXPIRES_KEY = 'cp_token_expires';
const TENANT_KEY  = 'cp_tenant_domain';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  username: string;
}

// ── Tenant ────────────────────────────────────────────────────────────────────

/**
 * Normalise user input into a fully-qualified hostname.
 * "christrends"                      → "christrends.<TENANT_BASE_DOMAIN>"
 * "christrends.churchpanel.ddev.site" → "christrends.churchpanel.ddev.site"
 * "https://christrends.org/foo"      → "christrends.org"
 */
export function resolveDomain(input: string): string {
  let d = input.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  if (d && !d.includes('.')) d = `${d}.${TENANT_BASE_DOMAIN}`;
  return d;
}

export function getTenantDomain(): string | null {
  return localStorage.getItem(TENANT_KEY);
}

function setTenantDomain(domain: string | null): void {
  if (domain) localStorage.setItem(TENANT_KEY, domain);
  else localStorage.removeItem(TENANT_KEY);
}

function getApiBase(): string {
  const tenant = getTenantDomain();
  return tenant ? `https://${tenant}` : DEFAULT_API_BASE;
}

// ── Storage ───────────────────────────────────────────────────────────────────

function storeToken(data: { access_token: string; expires_in: number }): void {
  // expires_in is in minutes (Wave default: 60)
  const expiresAt = Date.now() + data.expires_in * 60 * 1_000;
  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(EXPIRES_KEY, String(expiresAt));
}

/** Returns the raw stored token regardless of expiry — needed for the refresh call itself. */
function rawToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getToken(): string | null {
  const token     = localStorage.getItem(TOKEN_KEY);
  const expiresAt = localStorage.getItem(EXPIRES_KEY);
  if (!token || !expiresAt) return null;
  if (Date.now() > Number(expiresAt)) { logout(); return null; }
  return token;
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

export function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ── Login ─────────────────────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  tenantDomain?: string,
): Promise<void> {
  const base = tenantDomain ? `https://${tenantDomain}` : DEFAULT_API_BASE;

  let res: Response;
  try {
    res = await fetch(`${base}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error(
      tenantDomain
        ? 'Unable to connect. Verify the workspace domain and your internet connection.'
        : 'Unable to connect. Check your internet connection and try again.',
    );
  }

  if (res.status === 401) throw new Error('Incorrect email or password.');
  if (!res.ok) throw new Error(`Something went wrong (${res.status}). Please try again.`);

  const data = await res.json() as { access_token: string; expires_in: number };

  // Persist tenant BEFORE storing the token so getApiBase() is correct on first use.
  setTenantDomain(tenantDomain ?? null);
  storeToken(data);
  scheduleRefresh();
}

// ── Logout ────────────────────────────────────────────────────────────────────

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(TENANT_KEY);
  cancelSchedule();
}

// ── Refresh ───────────────────────────────────────────────────────────────────

/**
 * In-flight refresh promise shared across all concurrent callers.
 * tymon/jwt-auth blacklists the old token after one use, so only one
 * refresh call must fly at a time — others await this same promise.
 */
let refreshPromise: Promise<void> | null = null;

export async function refresh(): Promise<void> {
  if (refreshPromise) return refreshPromise;

  const token = rawToken();
  if (!token) throw new Error('No token stored — please sign in.');

  refreshPromise = (async (): Promise<void> => {
    let res: Response;
    try {
      res = await fetch(`${getApiBase()}/api/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch {
      throw new Error('Unable to connect.');
    }

    if (!res.ok) {
      logout();
      throw new Error('Your session has expired. Please sign in again.');
    }

    const data = await res.json() as { access_token: string; expires_in: number };
    storeToken(data);
    scheduleRefresh(); // reschedule for the new token's lifetime
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ── Proactive scheduler ───────────────────────────────────────────────────────

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function cancelSchedule(): void {
  if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
}

function scheduleRefresh(): void {
  cancelSchedule();

  const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || '0');
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return;

  // Refresh this long before expiry: 20% of token lifetime, minimum 30 seconds.
  // For a 60-min token: fires 12 minutes early (at the 48-min mark).
  const buffer = Math.max(remaining * 0.2, 30_000);
  const delay  = remaining - buffer;

  refreshTimer = setTimeout(async () => {
    try {
      await refresh();
    } catch {
      // Proactive refresh failed (offline, etc.) — apiFetch will handle 401 reactively.
    }
  }, delay);
}

// ── apiFetch — authenticated fetch with 401 auto-retry ───────────────────────

/**
 * Drop-in fetch wrapper for authenticated API calls.
 *   - Attaches the current Bearer token automatically.
 *   - On 401: refreshes the token and retries the request once.
 *   - On refresh failure: calls logout() and throws so the caller can redirect.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${getApiBase()}${path}`;

  const buildHeaders = (): Record<string, string> => ({
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...authHeader(),
    ...(options.headers as Record<string, string> ?? {}),
  });

  let res = await fetch(url, { ...options, headers: buildHeaders() });

  if (res.status === 401) {
    try {
      await refresh(); // shared promise — concurrent 401s all await one refresh
    } catch (err) {
      logout();
      throw err; // caller (e.g. router guard) should redirect to /login
    }
    res = await fetch(url, { ...options, headers: buildHeaders() });
  }

  return res;
}

// ── Boot ──────────────────────────────────────────────────────────────────────

/**
 * Call once when the app boots. Resumes the proactive refresh schedule if the
 * user was already signed in, and registers a visibility handler to catch the
 * case where the device returns from a long background sleep.
 */
export function initAuth(): void {
  if (isAuthenticated()) scheduleRefresh();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    if (!isAuthenticated()) return;

    const expiresAt = Number(localStorage.getItem(EXPIRES_KEY) || '0');
    const remaining = expiresAt - Date.now();

    // If the device was asleep and there's less than 2 minutes left, refresh now.
    if (remaining < 2 * 60 * 1_000) {
      refresh().catch(() => {});
    } else {
      // The timer may have fired while in the background without completing —
      // reschedule to get back on the right cadence.
      scheduleRefresh();
    }
  });
}
