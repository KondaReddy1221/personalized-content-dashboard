import { redirect } from 'next/navigation';
import DashboardApp from '@/components/dashboard/DashboardApp';
import { getCurrentUser } from '@/lib/auth';

export default async function TrendingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <DashboardApp initialSection="trending" currentUser={user} />;
}
