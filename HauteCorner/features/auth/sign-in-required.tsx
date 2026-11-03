import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { StateMessage } from '@/components/state-message';
import { useSession } from '@/features/auth/session';
import { useColors } from '@/hooks/use-colors';

type SignInRequiredProps = {
  title: string;
  message: string;
  children: ReactNode;
};

export const openSignIn = () => router.push('/sign-in');

// Browsing never needs an account. Checkout, the wish list, orders and selling do.
export function SignInRequired({ title, message, children }: SignInRequiredProps) {
  const status = useSession((state) => state.status);
  const colors = useColors();

  if (status === 'signedIn') return children;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {status === 'signedOut' ? (
        <StateMessage title={title} message={message} actionLabel="Sign in" onAction={openSignIn} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
