'use client';

import React from 'react';
import { ViewMode } from '@/types/lms';
import { AuthUser } from '@/types/auth';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import {
  Sparkles,
  BookOpen,
  FlaskConical,
  FileText,
  Shield,
  LogIn,
  UserPlus,
  LogOut,
  UserCheck,
  Menu,
  X,
  Lock,
} from 'lucide-react';

interface NavbarProps {
  currentUser: AuthUser | null;
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
  onOpenAuthModal: (mode: 'LOGIN' | 'REGISTER' | 'INSTRUCTOR_LOGIN') => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  viewMode,
  onToggleViewMode,
  activeSection,
  onSelectSection,
  onOpenAuthModal,
  onLogout,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const isInstructor = currentUser?.role === 'INSTRUCTOR';

  const navItems = [
    { id: 'courses', label: 'المساقات والمحاضرات', icon: BookOpen },
    { id: 'quizzes', label: 'المعمل وبنك التحديات', icon: FlaskConical },
    { id: 'booklets', label: 'مذكرات وملازم د. عمر', icon: FileText },
    ...(currentUser
      ? [
          {
            id: 'submissions',
            label: isInstructor ? 'تصحيح إجابات الطلاب' : 'واجباتي وتكليفاتي',
            icon: Shield,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 apple-glass border-b border-burgundy-900/10 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Right: Phenol Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onSelectSection('courses')}
              className="text-right focus:outline-none"
            >
              <PhenolLogo size={46} />
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 bg-burgundy-950/5 p-1 rounded-full border border-burgundy-950/10">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectSection(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-burgundy-950 text-gold-400 shadow-sm font-bold'
                        : 'text-burgundy-900/80 hover:text-burgundy-950 hover:bg-burgundy-900/5'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-gold-400' : 'text-burgundy-700'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Left: Authentication / Profile controls */}
          <div className="flex items-center gap-3">
            {/* If NOT logged in (Guest) */}
            {!currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuthModal('LOGIN')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-burgundy-950 hover:bg-burgundy-50 border border-transparent hover:border-burgundy-200 transition"
                >
                  <LogIn className="w-3.5 h-3.5 text-burgundy-800" />
                  <span>دخول طالب</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('REGISTER')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-gold-300 text-burgundy-950 font-extrabold text-xs shadow-goldGlow transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>حساب جديد</span>
                </button>

                <button
                  onClick={() => onOpenAuthModal('INSTRUCTOR_LOGIN')}
                  title="دخول د. عمر مجدي"
                  className="p-2 rounded-xl text-slate-400 hover:text-burgundy-950 hover:bg-slate-100 transition"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* If Logged in (Student or Dr. Omar) */
              <div className="flex items-center gap-3">
                {/* Dr. Omar ONLY Switcher */}
                {isInstructor && (
                  <div className="hidden sm:flex items-center bg-burgundy-50 border border-burgundy-200/80 p-1 rounded-xl">
                    <button
                      onClick={() => onToggleViewMode('STUDENT')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewMode === 'STUDENT'
                          ? 'bg-white text-burgundy-950 shadow-sm font-bold'
                          : 'text-burgundy-800 hover:text-burgundy-950'
                      }`}
                    >
                      معاينة كطالب
                    </button>
                    <button
                      onClick={() => onToggleViewMode('INSTRUCTOR')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        viewMode === 'INSTRUCTOR'
                          ? 'bg-burgundy-950 text-gold-400 shadow-md font-bold'
                          : 'text-burgundy-800 hover:text-burgundy-950'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 text-gold-400" />
                      <span>لوحة د. عمر</span>
                    </button>
                  </div>
                )}

                {/* User Info Capsule */}
                <div className="flex items-center gap-2.5 bg-white border border-burgundy-900/10 px-3 py-1.5 rounded-2xl shadow-sm">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-gold-400"
                  />
                  <div className="text-right hidden sm:block">
                    <span className="block text-xs font-bold text-burgundy-950 leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {isInstructor ? 'محاضر المنصة' : 'طالب كيمياء'}
                    </span>
                  </div>

                  <button
                    onClick={onLogout}
                    title="تسجيل الخروج"
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-burgundy-950 hover:bg-burgundy-50 rounded-xl transition"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-burgundy-100 bg-white/95 px-4 pt-3 pb-5 space-y-2 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-burgundy-950 text-gold-400 font-bold'
                    : 'text-burgundy-900 hover:bg-burgundy-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
