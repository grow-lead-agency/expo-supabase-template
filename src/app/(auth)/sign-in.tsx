import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { signInWithMagicLink } from '@/lib/auth';

export default function SignInScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!email.includes('@')) {
      setError(t('error.invalidEmail'));
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: authError } = await signInWithMagicLink(email);
    setSubmitting(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 justify-center px-6 gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-white">{t('welcome')}</Text>
          <Text className="text-base text-zinc-500 dark:text-zinc-400">{t('email')}</Text>
        </View>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('emailPlaceholder')}
          placeholderTextColor="#A1A1AA"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!submitting && !sent}
          className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
        />

        {error && <Text className="text-sm text-red-500">{error}</Text>}

        {sent ? (
          <View className="rounded-2xl bg-green-50 p-4 dark:bg-green-950">
            <Text className="text-sm text-green-800 dark:text-green-200">{t('magicLinkSent')}</Text>
          </View>
        ) : (
          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className="h-12 flex-row items-center justify-center rounded-2xl bg-primary-500 active:opacity-70"
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-base font-bold text-white">{t('magicLink')}</Text>
            )}
          </Pressable>
        )}

        <View className="items-center pt-4">
          <LanguageSwitcher />
        </View>
      </View>
    </SafeAreaView>
  );
}
