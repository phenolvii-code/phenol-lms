'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PhenolLogo } from '@/components/brand/PhenolLogo';
import { OfficeTab } from '@/components/dashboard/admin/OfficeTab';
import { useCurrentUser } from '@/lib/auth/useCurrentUser';

// ==============================================================================
// Dedicated Academy Office workspace (migration 026).
// The Academy Secretary has a real destination: pricing, enrollment queue,
// payments desk, and settlement preparation. Founder-only controls (commission
// policy, payout confirmation) are hidden by OfficeTab's secretary mode.
// ==============================================================================

export default function AcademyOfficePage() {
  const router = useRouter();
  const { user, isLoading, signOut } = useCurrentUser();

  const isSuperAdmin = user?.isSuperAdmin || user?.role === 'SUPER_ADMIN';
  const isSecretary = user?.role === 'SECRETARY' || user?.isSecretary;

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!isSuperAdmin && !isSecretary) {
      router.replace('/dashboard');
    }
  }, [isLoading, user, isSuperAdmin, isSecretary, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-ivory-200 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-10 h-10 rounded-full border-2 border-burgundy-500 border-t-transparent animate-spin mb-4" />
        <p className="text-xs font-semibold text-charcoal-100">Verifying office credentials...</p>
      </div>
    );
  }

  if (!isSuperAdmin && !isSecretary) {
    return (
      <div className="min-h-screen bg-ivory-200 flex flex-col items-center justify-center p-6 text-center font-sans space-y-3">
        <p className="text-xs font-semibold text-charcoal-100">
          This workspace is reserved for the academy office.
        </p>
        <Link href="/dashboard" className="text-xs font-bold text-burgundy-500 underline">
          Back to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ivory-200 text-charcoal-900 flex flex-col font-sans selection:bg-burgundy-500 selection:text-ivory-100">
      <header className="border-b border-hairline bg-ivory-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Link href="/" aria-label="PHENOL Home">
                <PhenolLogo size={36} />
              </Link>
              <div className="flex flex-col">
                <span className="text-sm font-bold font-display leading-tight">Academy Office</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-100">
                  {isSecretary ? 'Secretary workspace' : 'Founder workspace'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-[11px] font-mono text-charcoal-100">
                {user.email}
              </span>
              {isSuperAdmin && (
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 border border-hairline text-[11px] font-bold text-charcoal-900 transition-colors"
                >
                  Dashboard
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
                className="px-3 py-1.5 rounded-lg bg-burgundy-500 hover:bg-burgundy-900 text-ivory-100 text-[11px] font-bold transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OfficeTab mode={isSecretary ? 'secretary' : 'super_admin'} />
      </main>
    </div>
  );
}
