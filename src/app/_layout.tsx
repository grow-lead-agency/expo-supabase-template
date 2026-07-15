import '@/global.css';
import '@/lib/i18n';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ErrorBoundaryProps } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider } from 'posthog-react-native';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/use-auth';
import { posthog } from '@/lib/posthog';
import { queryClient } from '@/lib/query-client';
import { initSentry, Sentry, sentryEnabled } from '@/lib/sentry';

initSentry(); // env-gated no-op without EXPO_PUBLIC_SENTRY_DSN (ADR-009)

/**
 * Global error boundary (expo-router convention). Captures render errors to
 * Sentry (no-op when disabled) and shows a recoverable fallback instead of a
 * white screen.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text className="text-center text-xl font-bold text-foreground">
          {t('errorBoundary.title')}
        </Text>
        <Text className="text-center text-sm text-muted-foreground">{error.message}</Text>
        <Pressable
          onPress={retry}
          className="h-12 items-center justify-center rounded-2xl bg-primary px-6 active:opacity-70"
        >
          <Text className="text-base font-bold text-primary-foreground">
            {t('errorBoundary.retry')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function RootStack() {
  const segments = useSegments();
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // `auth` (deep-link callback) is a neutral zone — never redirect away from
    // it while the code→session exchange is in flight (ADR-007).
    const inAuthZone = segments[0] === '(auth)' || segments[0] === 'auth';
    if (!session && !inAuthZone) {
      router.replace('/(auth)/sign-in');
    } else if (session && segments[0] === '(auth)') {
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

function RootLayout() {
  const app = (
    <QueryClientProvider client={queryClient}>
      <RootStack />
      <StatusBar style="auto" />
    </QueryClientProvider>
  );

  return (
    <SafeAreaProvider>
      {posthog ? <PostHogProvider client={posthog}>{app}</PostHogProvider> : app}
      {/* Portal target for Dialog/overlay primitives (react-native-reusables) */}
      <PortalHost />
    </SafeAreaProvider>
  );
}

export default sentryEnabled ? Sentry.wrap(RootLayout) : RootLayout;
