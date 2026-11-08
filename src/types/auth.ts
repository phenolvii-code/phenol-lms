export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'GUEST';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  governorate?: string;
  role: UserRole;
  avatar: string;
  registeredAt: string;
  title?: string;
  bio?: string;
  specialization?: string;
}

export const ADMIN_EMAILS = [
  'phenolvii@gmail.com',
  'admin@phenol.academy',
  'dromar@phenol.academy',
];

export type AuthModalMode = 'LOGIN' | 'REGISTER' | 'INSTRUCTOR_LOGIN';
