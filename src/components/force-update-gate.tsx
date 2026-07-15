import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { checkForceUpdate, type UpdateStatus } from '@/lib/force-update';
import { supabase } from '@/lib/supabase';

/**
 * Force-update gate (PROD-5165 / ADR-010).
 *
 * Reads `public.app_config` (min_version / recommended_version) on mount and
 * renders:
 * - 'blocked' → full-screen blocking overlay on top of children, with an
 *   "Update" CTA to the store listing (only shown if `extra.appStoreId` is
 *   configured in app.json).
 * - 'nudge'   → dismissible banner above children; app remains usable.
 * - 'ok' / still loading → children render immediately, no spinner. The
 *   check never blocks first paint — only a confirmed 'blocked' result
 *   overlays the UI once it resolves.
 */
export function ForceUpdateGate({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<UpdateStatus>('ok');
  const [nudgeDismissed, setNudgeDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    checkForceUpdate({
      fetchConfig: async () => {
        const { data, error } = await supabase.from('app_config').select('key,value');
        if (error || !data) return null;
        return Object.fromEntries(data.map((row) => [row.key, row.value]));
      },
      currentVersion: Application.nativeApplicationVersion,
      testOverride: process.env.EXPO_PUBLIC_FORCE_UPDATE_TEST,
    }).then((result) => {
      if (!cancelled) setStatus(result);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const appStoreId = Constants.expoConfig?.extra?.appStoreId as string | undefined;
  const androidPackage = Constants.expoConfig?.android?.package;

  const handleUpdatePress = () => {
    const url =
      Platform.OS === 'ios'
        ? `itms-apps://apps.apple.com/app/id${appStoreId}`
        : `market://details?id=${androidPackage}`;
    Linking.openURL(url).catch(() => {
      // Best-effort — if the store app isn't available (simulator, no store
      // configured) there is nothing more useful to do than swallow it.
    });
  };

  return (
    <View className="flex-1">
      {status === 'nudge' && !nudgeDismissed ? (
        <View
          testID="force-update-nudge"
          className="flex-row items-center justify-between gap-2 bg-amber-100 px-4 py-3 dark:bg-amber-900"
        >
          <Text className="flex-1 text-sm text-amber-900 dark:text-amber-100">
            {t('forceUpdate.nudge')}
          </Text>
          <Pressable
            testID="force-update-nudge-dismiss"
            onPress={() => setNudgeDismissed(true)}
            className="px-2 py-1"
          >
            <Text className="text-sm font-bold text-amber-900 dark:text-amber-100">×</Text>
          </Pressable>
        </View>
      ) : null}

      {children}

      {status === 'blocked' ? (
        <View
          testID="force-update-blocked"
          className="absolute inset-0 items-center justify-center gap-4 bg-white px-8 dark:bg-zinc-950"
        >
          <Text className="text-5xl">🚧</Text>
          <Text className="text-center text-xl font-bold text-zinc-900 dark:text-white">
            {t('forceUpdate.title')}
          </Text>
          <Text className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            {t('forceUpdate.message')}
          </Text>
          {appStoreId ? (
            <Pressable
              testID="force-update-cta"
              onPress={handleUpdatePress}
              className="h-12 items-center justify-center rounded-2xl bg-primary-500 px-6 active:opacity-70"
            >
              <Text className="text-base font-bold text-white">{t('forceUpdate.cta')}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
