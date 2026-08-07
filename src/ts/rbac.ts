import { authState } from './auth-state';

/** Returns true if the authenticated user holds the given role name. */
export function hasRole(role: string): boolean {
  return authState.roles.includes(role);
}

/** Returns true if the authenticated user has been granted the given permission. */
export function can(permission: string): boolean {
  return authState.permissions.includes(permission);
}

/** Returns true if the user holds at least one of the given roles. */
export function hasAnyRole(roles: string[]): boolean {
  return roles.some(r => authState.roles.includes(r));
}

/** Returns true if the user holds at least one of the given permissions. */
export function hasAnyPermission(permissions: string[]): boolean {
  return permissions.some(p => authState.permissions.includes(p));
}
