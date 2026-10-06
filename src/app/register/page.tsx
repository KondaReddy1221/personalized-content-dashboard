import { redirect } from 'next/navigation';
import { AuthCard } from '@/components/auth/AuthCard';
import { getCurrentUser } from '@/lib/auth';

export default async function RegisterPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.2),_transparent_35%),linear-gradient(135deg,_#f8fafc,_#eef2ff_48%,_#ecfeff)] p-4 dark:bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_35%),linear-gradient(135deg,_#020817,_#0f172a_48%,_#111827)]">
      <AuthCard mode="register" />
    </main>
  );
}
