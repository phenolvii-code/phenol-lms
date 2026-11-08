import React from 'react';

interface InitialsProps {
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Initials({ name = 'Student', size = 'md', className = '' }: InitialsProps) {
  const getInitials = (str: string) => {
    const clean = str.trim();
    if (!clean) return 'PH';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-burgundy-900 text-ivory-100 font-serif font-bold tracking-wider select-none shrink-0 shadow-sm border border-burgundy-800 ${sizeClasses[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
}
