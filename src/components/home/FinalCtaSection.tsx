'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';
import { AuthUser } from '@/types/auth';

interface FinalCtaSectionProps {
  currentUser?: AuthUser | null;
  onSignUp?: () => void;
  onSignIn?: () => void;
  onStart?: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  currentUser,
  onSignUp,
  onSignIn,
  onStart,
}) => {
  const handleSignUp = onSignUp || onStart;
  return (
    <section className="py-16 sm:py-20 lg:py-24 border-t border-hairline px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
      <div className="space-y-6 max-w-2xl mx-auto">
        <span className="font-formula text-xs text-burgundy-500 font-bold uppercase tracking-widest block">
          START YOUR JOURNEY
        </span>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-charcoal-900 font-display py-2">
          <span className="block mb-2 sm:mb-3">Start with Understanding.</span>
          <span className="text-burgundy-500 block">Let Memorization Follow.</span>
        </h2>

        <p className="text-sm sm:text-base text-charcoal-100 max-w-xl mx-auto leading-relaxed font-sans">
          Experience an elevated academic standard. Learn how to think in chemistry and derive complex answers from first principles.
        </p>

        {/* Action Buttons: Context-Aware Authentication */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 max-w-md sm:max-w-none mx-auto">
          {currentUser ? (
            <>
              <Link
                href="/dashboard"
                className="w-full sm:w-auto min-w-[210px] inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ring-2 ring-burgundy-500/20"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/courses"
                className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border-2 border-burgundy-500 text-burgundy-500 hover:text-burgundy-900 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Browse Courses</span>
              </Link>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleSignUp}
                className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 active:scale-[0.98] text-ivory-100 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 cursor-pointer ring-2 ring-burgundy-500/20"
              >
                <span>Sign Up</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onSignIn}
                className="w-full sm:w-auto min-w-[190px] inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg bg-ivory-100 hover:bg-ivory-300 active:scale-[0.98] border-2 border-burgundy-500 text-burgundy-500 hover:text-burgundy-900 font-sans font-bold text-base sm:text-lg transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Sign In</span>
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
