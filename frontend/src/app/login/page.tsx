'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('admin@umurava.local');
  const [password, setPassword] = useState('Admin@12345');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.data.data);
      toast.success('Signed in successfully');
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.22),_transparent_28%),radial-gradient(circle_at_85%_15%,_rgba(14,165,233,0.22),_transparent_22%),linear-gradient(135deg,_#050816_0%,_#0a1020_46%,_#120f1e_100%)] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-12 lg:flex-row lg:items-center lg:gap-16">
        <section className="max-w-xl pb-12 lg:pb-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-100/80">
            Protected recruiting workspace
          </div>
          <h1 className="max-w-lg font-serif text-5xl leading-tight text-white sm:text-6xl">
            Secure every hiring decision before the dashboard opens.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/72 sm:text-lg">
            Sign in to access candidate records, screening runs, uploaded resumes, and recruiter workflows.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-sm text-white/55">Access control</p>
              <p className="mt-2 text-xl font-medium text-white">JWT-protected APIs and uploads</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
              <p className="text-sm text-white/55">Starter credentials</p>
              <p className="mt-2 text-xl font-medium text-white">Ready to join our platform</p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-md">
          <div className="rounded-[32px] border border-white/10 bg-[#0c1326]/85 p-7 shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.26em] text-cyan-200/70">Umurava</p>
                <h2 className="mt-2 font-serif text-3xl">Login</h2>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#fb7185)] text-lg font-semibold text-slate-950">
                U
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm text-white/65">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.08]"
                  placeholder="admin@company.com"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-white/65">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition focus:border-cyan-300/50 focus:bg-white/[0.08]"
                  placeholder="Enter your password"
                  required
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-[linear-gradient(135deg,_#f59e0b,_#f97316,_#fb7185)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? 'Signing in...' : 'Enter Workspace'}
              </button>
            </form>
{/* 
            <div className="mt-6 rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-4 text-sm text-emerald-100/85">
              Default account: <span className="font-medium">admin@umurava.local</span> / <span className="font-medium">Admin@12345</span>
            </div> */}
          </div>
        </section>
      </div>
    </main>
  );
}
