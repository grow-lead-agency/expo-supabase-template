import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/hooks/use-auth';

export default function AppLayout() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
