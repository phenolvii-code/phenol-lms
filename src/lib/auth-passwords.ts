/**
 * PHENOL ACADEMY - Unified Password Management
 * Manages custom passwords per account and default authentication fallbacks.
 */

export const getUserPassword = (email: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('phenol_user_passwords');
    if (!raw) return null;
    const map = JSON.parse(raw);
    return map[email.trim().toLowerCase()] || null;
  } catch (e) {
    return null;
  }
};

export const setUserPassword = (email: string, newPassword: string): void => {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('phenol_user_passwords');
    const map = raw ? JSON.parse(raw) : {};
    map[email.trim().toLowerCase()] = newPassword;
    localStorage.setItem('phenol_user_passwords', JSON.stringify(map));
  } catch (e) {
    console.error('Error saving user password:', e);
  }
};

export const verifyUserPassword = (email: string, inputPassword: string): boolean => {
  const cleanEmail = email.trim().toLowerCase();
  const customPass = getUserPassword(cleanEmail);
  if (customPass) {
    return inputPassword === customPass;
  }
  // Default initial passwords before user customizes their own:
  return (
    inputPassword === 'phenol2026' ||
    inputPassword === '123456' ||
    inputPassword === 'demo' ||
    inputPassword === 'admin'
  );
};
