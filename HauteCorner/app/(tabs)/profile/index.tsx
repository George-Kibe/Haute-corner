import { FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { Image } from 'expo-image';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Alert, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { StateMessage } from '@/components/state-message';
import { SITE_URL } from '@/constants/site';
import { deleteAccount, signOut } from '@/features/auth/providers';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { useMe } from '@/features/auth/queries';
import { SignInRequired } from '@/features/auth/sign-in-required';
import type { Address, SignInMethod } from '@/features/auth/types';
import { useColors } from '@/hooks/use-colors';

const formatAddress = (address: Address | null) =>
  address ? [address.line1, address.area, address.city].filter(Boolean).join(', ') : null;

const editProfile = () => router.push('/edit-profile');

const METHOD_NAMES: Record<SignInMethod, string> = { google: 'Google', apple: 'Apple', email: 'Email and password' };
const describeMethods = (methods: SignInMethod[]) => methods.map((method) => METHOD_NAMES[method]).join(', ');

export default function ProfileScreen() {
  return (
    <SignInRequired title="Your profile" message="Sign in to keep your delivery details, saved items and orders in one place.">
      <Profile />
    </SignInRequired>
  );
}

function confirmSignOut() {
  Alert.alert('Sign out?', 'You can still browse while signed out.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
  ]);
}

function confirmDeleteAccount() {
  Alert.alert(
    'Delete your account?',
    'This removes your profile, delivery details and saved items, and signs you out on every device. It cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete account',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            Toast.show({ type: 'success', text1: 'Your account has been deleted' });
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: 'Could not delete your account',
              text2: error instanceof Error ? error.message : undefined,
            });
          }
        },
      },
    ],
  );
}

function Profile() {
  const colors = useColors();
  const secondary = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;
  const { data: user, error, isPending, refetch } = useMe();

  if (isPending) return <ProfileSkeleton />;

  if (!user) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          title="Could not load your profile"
          message={error?.message}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button onPress={editProfile}>
          <Stack.Toolbar.Label>Edit</Stack.Toolbar.Label>
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Host style={styles.fill}>
        <FieldGroup>
          <FieldGroup.Section title="Account">
            <ListItem
              leading={user.avatarUrl ? <Image source={user.avatarUrl} style={styles.avatar} /> : undefined}
              supportingText={secondary(user.email ?? 'No email shared')}
              onPress={editProfile}>
              {user.name ?? 'Add your name'}
            </ListItem>
            <ListItem supportingText={secondary(describeMethods(user.signInMethods))}>Sign in with</ListItem>
            {user.email ? (
              <ListItem
                onPress={() => router.push({ pathname: '/forgot-password', params: { email: user.email!, change: '1' } })}>
                {user.signInMethods.includes('email') ? 'Change password' : 'Add a password'}
              </ListItem>
            ) : null}
          </FieldGroup.Section>

          <FieldGroup.Section title="Delivery">
            <ListItem supportingText={secondary(user.phone ?? 'Not added yet')} onPress={editProfile}>
              Phone
            </ListItem>
            <ListItem supportingText={secondary(formatAddress(user.deliveryAddress) ?? 'Not added yet')} onPress={editProfile}>
              Delivery address
            </ListItem>
          </FieldGroup.Section>

          <FieldGroup.Section title="About">
            <ListItem onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/privacy`)}>Privacy policy</ListItem>
            <ListItem onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/terms`)}>Terms of use</ListItem>
          </FieldGroup.Section>

          <FieldGroup.Section>
            <ListItem onPress={confirmSignOut}>Sign out</ListItem>
            <ListItem onPress={confirmDeleteAccount}>
              <Text textStyle={{ color: colors.danger }}>Delete account</Text>
            </ListItem>
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});
