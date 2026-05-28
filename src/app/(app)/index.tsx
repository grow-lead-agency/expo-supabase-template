import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 px-6 py-8 gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-white">{t('dashboard')}</Text>
          {user?.email && (
            <Text className="text-base text-zinc-500 dark:text-zinc-400">
              {t('loggedInAs', { email: user.email })}
            </Text>
          )}
        </View>

        <View className="flex-1" />

        <View className="gap-4">
          <LanguageSwitcher />

          <Pressable
            onPress={() => signOut()}
            className="h-12 flex-row items-center justify-center rounded-2xl border border-zinc-200 bg-white active:opacity-70 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <Text className="text-base font-bold text-zinc-900 dark:text-white">
              {t('signOut')}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
