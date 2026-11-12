export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'SUPER_ADMIN' | 'GUEST';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  governorate?: string;
  role: UserRole;
  avatar?: string;
  registeredAt: string;
  title?: string;
  bio?: string;
  specialization?: string;
  academicCode?: string;
  whatsapp?: string;
  academicTrack?: string;
  isSuperAdmin?: boolean;
}

export type AuthModalMode = 'LOGIN' | 'REGISTER' | 'INSTRUCTOR_LOGIN' | 'WHATSAPP_REQUIRED';
