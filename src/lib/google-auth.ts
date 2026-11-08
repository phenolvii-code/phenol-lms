/**
 * PHENOL ACADEMY - Google Identity & Authentication Helpers
 */

export const GOOGLE_CLIENT_ID =
  '602328518749-atqa61ld2mv8np49cejhpe4l7lh8jnb9.apps.googleusercontent.com';

export interface GoogleIdTokenPayload {
  email: string;
  name: string;
  picture?: string;
  sub: string;
}

export function parseGoogleJwt(token: string): GoogleIdTokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
}
