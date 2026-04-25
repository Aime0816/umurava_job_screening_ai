'use client';

import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { useAuth } from '@/components/auth/AuthProvider';
import { setView } from '@/store/slices/uiSlice';

type TopbarProps = {
  onToggleMenu?: () => void;
};

const VIEW_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  screening:  'New Screening',
  rankings:   'Rankings',
  candidates: 'Candidates',
  jobs:       'Jobs',
};

export function Topbar({ onToggleMenu }: TopbarProps) {
  const dispatch  = useAppDispatch();
  const view      = useAppSelector((s) => s.ui.activeView);
  const screening = useAppSelector((s) => s.screening.current);
  const { user, logout } = useAuth();

  return (
    <header className="min-h-[60px] border-b border-white/[0.06] flex flex-wrap items-center gap-3 px-4 py-3 md:px-7 md:py-0">
      <button
        type="button"
        onClick={onToggleMenu}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 hover:border-white/20 md:hidden"
        aria-label="Open navigation menu"
      >
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 6h14" />
          <path d="M3 10h14" />
          <path d="M3 14h14" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        <h1 className="font-serif text-lg font-normal tracking-tight">
          {VIEW_TITLES[view]}
        </h1>
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          Gemini-AI Powered
        </div>
      </div>

      {screening.status === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-white/40">
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          AI is evaluating candidates…
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-400 text-xs font-semibold text-slate-950">
            {user?.name?.slice(0, 1).toUpperCase() || 'A'}
          </div>
          <div className="leading-tight">
            <p className="text-xs font-medium text-white">{user?.name || 'Administrator'}</p>
            <p className="text-[11px] text-white/45">{user?.email}</p>
          </div>
        </div>

        <button
          className="btn-ghost btn btn-sm"
          onClick={() => dispatch(setView('screening'))}
        >
          + New Job
        </button>
        <button
          className="btn-primary btn btn-sm"
          onClick={() => dispatch(setView('screening'))}
        >
          Run Screening
        </button>
        <button
          className="btn-ghost btn btn-sm"
          onClick={logout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
