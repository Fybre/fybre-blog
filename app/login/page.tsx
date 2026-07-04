import { hasUsers } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const needsSetup = !(await hasUsers());
  if (needsSetup) {
    redirect('/setup');
  }

  return <LoginForm />;
}
