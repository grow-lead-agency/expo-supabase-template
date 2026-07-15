import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';

/**
 * Deep-link target for magic link emails (ADR-007).
 * Supabase redirects here with `?code=` (PKCE) — exchange it for a session.
 * On success the root layout's auth guard routes to /(app).
 */
export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.code;
    if (!code) {
      setError(params.error_description ?? t('auth.callbackError'));
      return;
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setError(exchangeError.message);
      } else {
        router.replace('/(app)');
      }
    });
  }, [params.code, params.error_description, router, t]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-4 px-6">
        {error ? (
          <>
            <Text className="text-center text-base text-red-500">{error}</Text>
            <Link href="/(auth)/sign-in" replace className="text-base font-bold text-primary">
              {t('signIn')}
            </Link>
          </>
        ) : (
          <>
            <ActivityIndicator />
            <Text className="text-base text-muted-foreground">{t('loading')}</Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
