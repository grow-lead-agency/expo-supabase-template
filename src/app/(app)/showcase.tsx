// Dev-only component catalog — intentionally not localized (not a user-facing
// production screen; forks may delete it or keep it as a living style guide).
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Text } from '@/components/ui/text';

export default function ShowcaseScreen() {
  const [tab, setTab] = useState('account');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="gap-5 px-5 py-6">
        <View className="gap-1">
          <Text variant="h3">UI Showcase</Text>
          <Text variant="muted">react-native-reusables · add more via `bunx rnr add`</Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
            <CardDescription>variants × sizes (cva)</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button>
              <Text>Default</Text>
            </Button>
            <View className="flex-row gap-3">
              <Button variant="secondary" className="flex-1">
                <Text>Secondary</Text>
              </Button>
              <Button variant="outline" className="flex-1">
                <Text>Outline</Text>
              </Button>
            </View>
            <View className="flex-row gap-3">
              <Button variant="ghost" className="flex-1">
                <Text>Ghost</Text>
              </Button>
              <Button variant="destructive" className="flex-1">
                <Text>Destructive</Text>
              </Button>
            </View>
            <View className="flex-row items-center gap-3">
              <Button size="sm" variant="secondary">
                <Text>Small</Text>
              </Button>
              <Button size="lg" className="flex-1">
                <Text>Large</Text>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Input & Dialog</CardTitle>
            <CardDescription>form field + modal via PortalHost</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Input placeholder="Type something…" />
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Text>Open dialog</Text>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>
                    Rendered through @rn-primitives/portal in the root layout.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button>
                      <Text>Close</Text>
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tabs & Skeleton</CardTitle>
            <CardDescription>controlled tabs + loading placeholders</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full flex-row">
                <TabsTrigger value="account" className="flex-1">
                  <Text>Account</Text>
                </TabsTrigger>
                <TabsTrigger value="password" className="flex-1">
                  <Text>Password</Text>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="account" className="pt-3">
                <Text variant="muted">Account tab content.</Text>
              </TabsContent>
              <TabsContent value="password" className="pt-3">
                <Text variant="muted">Password tab content.</Text>
              </TabsContent>
            </Tabs>
            <View className="gap-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-24 w-full" />
            </View>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
