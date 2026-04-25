'use client';

import { useEffect, useState } from 'react';
import { ProtectedApp } from '@/components/auth/ProtectedApp';
import { useAuth } from '@/components/auth/AuthProvider';
import { Sidebar } from '@/components/ui/Sidebar';
import { Topbar } from '@/components/ui/Topbar';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { ScreeningView } from '@/components/screening/ScreeningView';
import { RankingsView } from '@/components/rankings/RankingsView';
import { CandidatesView } from '@/components/candidates/CandidatesView';
import { JobsView } from '@/components/jobs/JobsView';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { fetchScreeningHistory } from '@/store/slices/screeningSlice';
import { fetchJobs } from '@/store/slices/jobsSlice';
import { fetchCandidates } from '@/store/slices/candidatesSlice';

export default function Home() {
  const dispatch = useAppDispatch();
  const activeView = useAppSelector((s) => s.ui.activeView);
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Hydrate store on mount
    dispatch(fetchScreeningHistory());
    dispatch(fetchJobs());
    dispatch(fetchCandidates({}));
  }, [dispatch, isAuthenticated, isLoading]);

  return (
    <ProtectedApp>
      <div className="flex min-h-screen w-full overflow-hidden bg-[#0f1117]">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar onToggleMenu={() => setSidebarOpen((open) => !open)} />
          <main className="flex-1 overflow-y-auto min-w-0">
            {activeView === 'dashboard'  && <DashboardView />}
            {activeView === 'screening'  && <ScreeningView />}
            {activeView === 'rankings'   && <RankingsView />}
            {activeView === 'candidates' && <CandidatesView />}
            {activeView === 'jobs'       && <JobsView />}
          </main>
        </div>
      </div>
    </ProtectedApp>
  );
}
