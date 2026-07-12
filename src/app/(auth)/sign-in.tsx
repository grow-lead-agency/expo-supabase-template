import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { LanguageSwitcher } from '@/components/language-switcher';
import { signInWithMagicLink, verifyEmailOtp } from '@/lib/auth';

const emailSchema = z.object({
  email: z.email(),
});
type EmailForm = z.infer<typeof emailSchema>;

const otpSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});
type OtpForm = z.infer<typeof otpSchema>;

/**
 * Reference auth screen (ADR-004 + ADR-007): magic link primary, 6-digit OTP
 * code from the same email as the guaranteed fallback (link scanners / in-app
 * browsers can break deep links). Forms follow the template convention:
 * React Hook Form + Zod.
 */
export default function SignInScreen() {
  const { t } = useTranslation();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    defaultValues: { code: '' },
  });

  async function onSendLink({ email }: EmailForm) {
    setAuthError(null);
    const { error } = await signInWithMagicLink(email);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setSentTo(email);
  }

  async function onVerifyCode({ code }: OtpForm) {
    if (!sentTo) return;
    setAuthError(null);
    const { error } = await verifyEmailOtp(sentTo, code);
    if (error) {
      setAuthError(error.message);
    }
    // On success the auth listener flips the session and (auth)/_layout
    // redirects to /(app) — no manual navigation needed.
  }

  function onTryDifferentEmail() {
    setSentTo(null);
    setAuthError(null);
    otpForm.reset();
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <View className="flex-1 justify-center px-6 gap-6">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-zinc-900 dark:text-white">{t('welcome')}</Text>
          <Text className="text-base text-zinc-500 dark:text-zinc-400">
            {sentTo ? t('magicLinkSentTitle') : t('email')}
          </Text>
        </View>

        {sentTo ? (
          <View className="gap-4">
            <View className="rounded-2xl bg-green-50 p-4 dark:bg-green-950">
              <Text className="text-sm text-green-800 dark:text-green-200">
                {t('magicLinkSent', { email: sentTo })}
              </Text>
            </View>

            <Controller
              control={otpForm.control}
              name="code"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="sign-in-otp"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t('otpPlaceholder')}
                  placeholderTextColor="#A1A1AA"
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!otpForm.formState.isSubmitting}
                  className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-center text-lg tracking-widest text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              )}
            />
            {otpForm.formState.errors.code && (
              <Text className="text-sm text-red-500">{t('error.invalidOtp')}</Text>
            )}
            {authError && <Text className="text-sm text-red-500">{authError}</Text>}

            <Pressable
              testID="sign-in-verify"
              onPress={otpForm.handleSubmit(onVerifyCode)}
              disabled={otpForm.formState.isSubmitting}
              className="h-12 flex-row items-center justify-center rounded-2xl bg-primary-500 active:opacity-70"
            >
              {otpForm.formState.isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">{t('verifyCode')}</Text>
              )}
            </Pressable>

            <Pressable
              onPress={onTryDifferentEmail}
              className="items-center py-2 active:opacity-70"
            >
              <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                {t('tryDifferentEmail')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-4">
            <Controller
              control={emailForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  testID="sign-in-email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={t('emailPlaceholder')}
                  placeholderTextColor="#A1A1AA"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!emailForm.formState.isSubmitting}
                  className="h-12 rounded-2xl border border-zinc-200 bg-white px-4 text-base text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white"
                />
              )}
            />
            {emailForm.formState.errors.email && (
              <Text className="text-sm text-red-500">{t('error.invalidEmail')}</Text>
            )}
            {authError && <Text className="text-sm text-red-500">{authError}</Text>}

            <Pressable
              testID="sign-in-submit"
              onPress={emailForm.handleSubmit(onSendLink)}
              disabled={emailForm.formState.isSubmitting}
              className="h-12 flex-row items-center justify-center rounded-2xl bg-primary-500 active:opacity-70"
            >
              {emailForm.formState.isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-white">{t('magicLink')}</Text>
              )}
            </Pressable>
          </View>
        )}

        <View className="items-center pt-4">
          <LanguageSwitcher />
        </View>
      </View>
    </SafeAreaView>
  );
}
