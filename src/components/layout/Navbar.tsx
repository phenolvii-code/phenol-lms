'use client';

import React from 'react';
import { ViewMode } from '@/types/lms';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { Shield, Sparkles, BookOpen, FlaskConical, FileText, UserCheck, Menu, X } from 'lucide-react';

interface NavbarProps {
  viewMode: ViewMode;
  onToggleViewMode: (mode: ViewMode) => void;
  activeSection: string;
  onSelectSection: (section: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onToggleViewMode,
  activeSection,
  onSelectSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'courses', label: 'المساقات والمحاضرات', icon: BookOpen },
    { id: 'quizzes', label: 'المعمل وبنك التحديات', icon: FlaskConical },
    { id: 'booklets', label: 'مذكرات وملازم د. عمر', icon: FileText },
    { id: 'submissions', label: viewMode === 'INSTRUCTOR' ? 'تصحيح إجابات الطلاب' : 'واجباتي وتكليفاتي', icon: Shield },
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

          {/* Left: Mode Switcher (Student vs Dr. Omar Console) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-burgundy-50 border border-burgundy-200/80 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => onToggleViewMode('STUDENT')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'STUDENT'
                    ? 'bg-white text-burgundy-950 shadow-sm font-bold border border-burgundy-100'
                    : 'text-burgundy-800 hover:text-burgundy-950'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-burgundy-700" />
                <span className="hidden sm:inline">بوابة الطالب</span>
                <span className="sm:hidden">طالب</span>
              </button>

              <button
                onClick={() => onToggleViewMode('INSTRUCTOR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'INSTRUCTOR'
                    ? 'bg-burgundy-950 text-gold-400 shadow-md font-bold'
                    : 'text-burgundy-800 hover:text-burgundy-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span>لوحة د. عمر</span>
              </button>
            </div>

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
