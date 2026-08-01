# What This App Is

---

## Tech Stack

| Layer          | Library / Tool                                     |
| -------------- | -------------------------------------------------- |
| UI Framework   | Framework7 9 + Konsta 5                            |
| Language       | TypeScript 5.8                                     |
| Styling        | Tailwind CSS 4 + custom theme (`styles/theme.css`) |
| Routing        | Framework7 router (`routes.ts`)                    |
| Auth & Backend | ChurchPanel                                        |
| AI             | Google Gemini (`@google/genai`)                    |
| Native         | Capacitor 8 (iOS + Android)                        |
| Error Tracking | Sentry 10                                          |
| Build          | Vite 6                                             |
| Testing        | Vitest 4 + Testing Library React + JSDOM           |

---

## Component Building

- all components must be implemented using Container/Presentation pattern - to ensure that all component logic are housed in composables by default

---

## Commands

```bash
npm run dev        # Dev server on http://localhost:3000
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm test           # Vitest in watch mode
npm run test:run   # Vitest single run (CI)
```

After `npm run build`, use Capacitor CLI to sync to iOS/Android:

```bash
npx cap sync
npx cap open ios    # or android
```

---

## Environment Variables

Copy `.env.example` → `.env`. All client-side vars must be prefixed `VITE_`.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_POWERSYNC_URL=
VITE_VAPIR_PUBLIC_KEY=       # Web Push VAPID public key
VITE_SENTRY_DSN=
SENTRY_AUTH_TOKEN=           # Build-time only (source map upload)
SENTRY_ORG=
SENTRY_PROJECT=
GEMINI_API_KEY=              # Exposed via vite.config.ts define
```

---

## Key Architectural Patterns

### Data Layer — `services/api.ts`

### Offline-First Sync

- **PowerSyncContext** initializes the PowerSync client and monitors network state.
- The app stays fully functional offline using the local SQLite database.
- When online, PowerSync syncs automatically with Supabase.
- Multi-device updates use Supabase Realtime broadcast channels. Each device has a `deviceId` to avoid self-broadcast loops.

### Authentication

- **AuthContext** wraps the entire app with Supabase auth state.
- Unauthenticated users are redirected to `/login/`.

### Routing

Framework7 router is used (not React Router DOM). Navigate programmatically with:

```ts
f7.views.main.router.navigate("/routes/");
```

Routes are defined in `routes.ts` and map to page components.

### Notifications & Reminders

- **ReminderService**: Schedules reminders at frequencies (once, daily, weekdays, custom intervals).
- **NotificationService**: Uses Capacitor Local Notifications for native push.
- **PushNotificationService**: Web Push with VAPID keys for PWA.

### AI — Google Gemini

---

## Native (Capacitor)

- **App ID**: `com.lifenav.app`
- **Web dir**: `dist/` (Vite output)
- Splash screen: 3s duration, teal background `#00bfbf`, no spinner
- Plugins used: App, Keyboard, StatusBar, SplashScreen, Haptics, LocalNotifications, Network
- iOS project in `ios/`, Android project in `android/`

---

## Testing

## Things to Know

- Framework7 handles transitions and mobile gestures — do not add browser-style `<a>` navigation.
- `lib/database.types.ts` is generated — regenerate via `supabase gen types typescript` after schema changes, never edit by hand.
- The FAB (floating action button) visibility is managed by `FabContext` — pages control it via context, not local state.
- Tailwind 4 is configured via CSS (`@import "tailwindcss"`) not `tailwind.config.js`.
- Sentry is initialized in `index.tsx` before the React tree — keep it there.
