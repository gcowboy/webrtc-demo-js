import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { DashboardAuth } from '@/app/dashboard/DashboardAuth';

export default async function DashboardPage() {
  const { userId } = await auth();
  if (userId) {
    redirect('/');
  }
  return <DashboardAuth />;
}
