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
        className={cn(
          'rounded-full px-3 py-1.5',
          current === 'cs' ? 'bg-primary-500' : 'bg-zinc-100 dark:bg-zinc-800',
        )}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            current === 'cs' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300',
          )}
        >
          CZ
        </Text>
      </Pressable>
      <Pressable
        onPress={() => i18n.changeLanguage('en')}
        className={cn(
          'rounded-full px-3 py-1.5',
          current === 'en' ? 'bg-primary-500' : 'bg-zinc-100 dark:bg-zinc-800',
        )}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            current === 'en' ? 'text-white' : 'text-zinc-700 dark:text-zinc-300',
          )}
        >
          EN
        </Text>
      </Pressable>
    </View>
  );
}
