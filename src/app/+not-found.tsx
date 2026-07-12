import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <View className="flex-1 items-center justify-center gap-4 px-6">
          <Text className="text-center text-xl font-bold text-zinc-900 dark:text-white">
            {t('notFound.title')}
          </Text>
          <Link href="/" replace className="text-base font-bold text-primary-500">
            {t('notFound.goHome')}
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
