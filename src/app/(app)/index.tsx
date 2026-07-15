import { Link } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/hooks/use-auth';
import { signOut } from '@/lib/auth';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 py-8 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard')}</CardTitle>
            {user?.email && (
              <CardDescription>{t('loggedInAs', { email: user.email })}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <Link href="/showcase" asChild>
              <Button variant="secondary">
                <Text>UI Showcase</Text>
              </Button>
            </Link>
          </CardContent>
        </Card>

        <View className="flex-1" />

        <View className="gap-4">
          <LanguageSwitcher />

          <Button variant="outline" className="h-12" onPress={() => signOut()}>
            <Text className="font-bold">{t('signOut')}</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
