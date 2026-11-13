import { FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { FormButton } from '@/components/form-button';
import { StateMessage } from '@/components/state-message';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { SignInRequired } from '@/features/auth/sign-in-required';
import { usePayAgain, usePurchase } from '@/features/cart/queries';
import { lineKey, removeLines } from '@/features/cart/store';
import type { Purchase } from '@/features/cart/types';
import { useColors } from '@/hooks/use-colors';
import { countItems, formatPrice } from '@/lib/format';

export default function PurchaseScreen() {
  return (
    <SignInRequired title="Sign in to see this payment" message="Payments and orders belong to your account.">
      <PurchaseStatus />
    </SignInRequired>
  );
}

// Opens Paystack's page and waits for it to send the buyer back here.
async function openCardPage(purchase: Purchase) {
  if (!purchase.payment.authorizationUrl) return;
  await WebBrowser.openAuthSessionAsync(purchase.payment.authorizationUrl, `hautecorner://purchase/${purchase.ref}`);
}

function PurchaseStatus() {
  const colors = useColors();
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { data: purchase, error, refetch } = usePurchase(ref, true);
  const payAgain = usePayAgain(ref);
  const openedCardPage = useRef(false);
  const clearedCart = useRef(false);
  const status = purchase?.payment.status;

  // A card payment opens Paystack's page once, straight away.
  useEffect(() => {
    if (!purchase || openedCardPage.current) return;
    if (purchase.payment.method === 'card' && purchase.payment.status === 'pending' && purchase.payment.authorizationUrl) {
      openedCardPage.current = true;
      openCardPage(purchase).then(() => refetch());
    }
  }, [purchase, refetch]);

  // Once paid, what was bought leaves the cart.
  useEffect(() => {
    if (status !== 'paid' || !purchase || clearedCart.current) return;
    clearedCart.current = true;
    removeLines(purchase.orders.flatMap((order) => order.items.map((item) => lineKey(item.productId, item.option ?? undefined))));
  }, [purchase, status]);

  if (!purchase) {
    if (error) {
      return (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <StateMessage title="Could not load this payment" message={error.message} actionLabel="Try again" onAction={() => refetch()} />
        </View>
      );
    }
    return <ProfileSkeleton />;
  }

  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;
  const retry = async (payment?: Parameters<typeof payAgain.mutateAsync>[0]) => {
    try {
      const updated = await payAgain.mutateAsync(payment);
      if (updated.payment.method === 'card') await openCardPage(updated);
      refetch();
    } catch (problem) {
      Toast.show({ type: 'error', text1: 'Could not start the payment', text2: (problem as Error).message });
    }
  };

  const heading: Record<Purchase['payment']['status'], { title: string; message: string }> = {
    pending:
      purchase.payment.method === 'mpesa'
        ? { title: 'Check your phone', message: `Enter your M-Pesa PIN in the prompt sent to ${purchase.payment.phone}. This page updates on its own.` }
        : { title: 'Finish paying by card', message: 'Complete the payment on Paystack’s page. This page updates on its own.' },
    paid: { title: 'Payment received', message: 'Thank you. Each seller will confirm your order and arrange delivery.' },
    failed: { title: 'Payment did not go through', message: purchase.payment.failureReason ?? 'Nothing was charged. You can try again.' },
    expired: { title: 'This checkout expired', message: 'Payment did not arrive in time, so your items were released. Your cart still has anything not bought.' },
  };
  const { title, message } = heading[purchase.payment.status];

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        <FieldGroup.Section title={`Payment ${purchase.ref}`}>
          <ListItem supportingText={muted(message)}>{title}</ListItem>
          <ListItem supportingText={muted(formatPrice(purchase.total))}>
            {purchase.payment.method === 'mpesa' ? 'M-Pesa' : 'Card'}
          </ListItem>
          {purchase.payment.receipt ? <ListItem supportingText={muted(purchase.payment.receipt)}>M-Pesa receipt</ListItem> : null}

          {status === 'pending' && purchase.payment.method === 'mpesa' ? (
            <FormButton disabled={payAgain.isPending} label="Send the prompt again" variant="link" onPress={() => retry()} />
          ) : null}
          {status === 'pending' && purchase.payment.method === 'card' ? (
            <FormButton label="Open the card page" variant="link" onPress={() => openCardPage(purchase).then(() => refetch())} />
          ) : null}
          {status === 'failed' ? (
            <>
              <FormButton disabled={payAgain.isPending} label="Try again" onPress={() => retry()} />
              {purchase.payment.method === 'mpesa' ? (
                <FormButton label="Pay by card instead" variant="link" onPress={() => retry({ method: 'card' })} />
              ) : purchase.payment.phone ? (
                <FormButton label="Pay by M-Pesa instead" variant="link" onPress={() => retry({ method: 'mpesa', phone: purchase.payment.phone! })} />
              ) : null}
            </>
          ) : null}
          {status === 'expired' ? <FormButton label="Back to cart" onPress={() => router.replace('/shopping-cart')} /> : null}
        </FieldGroup.Section>

        <FieldGroup.Section title={purchase.orders.length > 1 ? `${purchase.orders.length} orders, one per seller` : 'Your order'}>
          {purchase.orders.map((order) => (
            <ListItem
              key={order.ref}
              supportingText={muted(`${countItems(order.items.reduce((sum, item) => sum + item.quantity, 0))} · ${formatPrice(order.total)} including delivery`)}
              onPress={status === 'paid' ? () => router.push({ pathname: '/orders/[ref]', params: { ref: order.ref } }) : undefined}>
              {order.seller.name}
            </ListItem>
          ))}
          {status === 'paid' ? (
            <FormButton label="Keep shopping" variant="link" onPress={() => router.dismissTo('/')} />
          ) : null}
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
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
});
