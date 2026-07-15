import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { cn } from '@/lib/utils';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        onPress={() => i18n.changeLanguage('cs')}
        className={cn('rounded-full px-3 py-1.5', current === 'cs' ? 'bg-primary' : 'bg-secondary')}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            current === 'cs' ? 'text-primary-foreground' : 'text-secondary-foreground',
          )}
        >
          CZ
        </Text>
      </Pressable>
      <Pressable
        onPress={() => i18n.changeLanguage('en')}
        className={cn('rounded-full px-3 py-1.5', current === 'en' ? 'bg-primary' : 'bg-secondary')}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            current === 'en' ? 'text-primary-foreground' : 'text-secondary-foreground',
          )}
        >
          EN
        </Text>
      </Pressable>
    </View>
  );
}
