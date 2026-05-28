import '@/global.css';
import '@/lib/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { posthog } from '@/lib/posthog';
import { queryClient } from '@/lib/query-client';

function RootStack() {
  const segments = useSegments();
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(app)');
    }
  }, [loading, segments, session, router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PostHogProvider client={posthog}>
        <QueryClientProvider client={queryClient}>
          <RootStack />
          <StatusBar style="auto" />
        </QueryClientProvider>
      </PostHogProvider>
    </SafeAreaProvider>
  );
}
