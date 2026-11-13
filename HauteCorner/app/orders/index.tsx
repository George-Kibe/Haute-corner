import { FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { StateMessage } from '@/components/state-message';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { SignInRequired } from '@/features/auth/sign-in-required';
import { useOrders } from '@/features/cart/queries';
import { formatOrderDate, ORDER_STATUS_LABELS } from '@/features/orders/labels';
import { useColors } from '@/hooks/use-colors';
import { formatPrice } from '@/lib/format';

export default function OrdersScreen() {
  return (
    <SignInRequired title="Your orders" message="Sign in to see your orders and where they are.">
      <OrderList />
    </SignInRequired>
  );
}

function OrderList() {
  const colors = useColors();
  const { data, error, isPending, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useOrders();
  const orders = data?.pages.flatMap((page) => page.data) ?? [];
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isPending) return <ProfileSkeleton />;
  if (error || orders.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        {error ? (
          <StateMessage title="Could not load your orders" message={error.message} actionLabel="Try again" onAction={() => refetch()} />
        ) : (
          <StateMessage title="No orders yet" message="Orders appear here once paid." actionLabel="Start shopping" onAction={() => router.replace('/categories')} />
        )}
      </View>
    );
  }

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        <FieldGroup.Section>
          {orders.map((order) => (
            <ListItem
              key={order.ref}
              supportingText={muted(`${ORDER_STATUS_LABELS[order.status]} · ${formatPrice(order.total)} · ${formatOrderDate(order.createdAt)}`)}
              testID={`order-${order.ref}`}
              onPress={() => router.push({ pathname: '/orders/[ref]', params: { ref: order.ref } })}>
              {`${order.seller.name} · ${order.ref}`}
            </ListItem>
          ))}
          {hasNextPage ? (
            <FormButton disabled={isFetchingNextPage} label="Show older orders" variant="link" onPress={() => fetchNextPage()} />
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
