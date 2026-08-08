import { reactive } from 'vue';
import { isAuthenticated, getStoredUser } from './auth';

function storedRoles(): string[] {
  return getStoredUser()?.roles ?? [];
}

function storedPermissions(): string[] 
{
  return getStoredUser()?.permissions ?? [];
}

export const authState = reactive({
  loggedIn: isAuthenticated(),
  roles: storedRoles(),
  permissions: storedPermissions(),
});

/** Call after login or profile refresh to sync RBAC state from localStorage. */
export function syncAuthState(): void {
  authState.loggedIn = isAuthenticated();
  authState.roles = storedRoles();
  authState.permissions = storedPermissions();
}
