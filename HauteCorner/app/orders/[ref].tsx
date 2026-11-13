import { FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StateMessage } from '@/components/state-message';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { SignInRequired } from '@/features/auth/sign-in-required';
import { useOrder } from '@/features/cart/queries';
import { useAppConfig } from '@/features/config/use-app-config';
import { formatOrderDate, ORDER_STATUS_LABELS } from '@/features/orders/labels';
import { useColors } from '@/hooks/use-colors';
import { formatPrice } from '@/lib/format';
import { imageUrl } from '@/lib/media';

export default function OrderScreen() {
  return (
    <SignInRequired title="Your order" message="Sign in to see this order.">
      <OrderDetails />
    </SignInRequired>
  );
}

function OrderDetails() {
  const colors = useColors();
  const { ref } = useLocalSearchParams<{ ref: string }>();
  const { data: order, error, refetch } = useOrder(ref);
  const { data: config } = useAppConfig();
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  if (!order) {
    if (error) {
      return (
        <View style={[styles.centered, { backgroundColor: colors.background }]}>
          <StateMessage title="Could not load this order" message={error.message} actionLabel="Try again" onAction={() => refetch()} />
        </View>
      );
    }
    return <ProfileSkeleton />;
  }

  const address = [order.deliveryAddress.line1, order.deliveryAddress.area, order.deliveryAddress.city].filter(Boolean).join(', ');

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        <FieldGroup.Section title={`Order ${order.ref}`}>
          <ListItem supportingText={muted(`From ${order.seller.name} · placed ${formatOrderDate(order.createdAt)}`)}>
            {ORDER_STATUS_LABELS[order.status]}
          </ListItem>
        </FieldGroup.Section>

        <FieldGroup.Section title="Items">
          {order.items.map((item) => (
            <ListItem
              key={`${item.productId}:${item.option ?? ''}`}
              leading={
                config ? <Image contentFit="cover" source={imageUrl(config.cloudinaryCloudName, item.image, 200)} style={styles.thumbnail} /> : undefined
              }
              supportingText={muted(`${item.option ? `Size ${item.option} · ` : ''}${item.quantity} × ${formatPrice(item.unitPrice)}`)}
              onPress={() => router.push({ pathname: '/products/[id]', params: { id: item.productId } })}>
              {item.title}
            </ListItem>
          ))}
          <ListItem supportingText={muted(formatPrice(order.deliveryFee))}>Delivery</ListItem>
          <ListItem supportingText={<Text textStyle={{ fontWeight: '800' }}>{formatPrice(order.total)}</Text>}>Total</ListItem>
        </FieldGroup.Section>

        <FieldGroup.Section title="Delivery">
          <ListItem supportingText={muted(`${order.contact.name} · ${order.contact.phone}`)}>{address}</ListItem>
          {order.deliveryAddress.notes ? <ListItem supportingText={muted(order.deliveryAddress.notes)}>Directions</ListItem> : null}
        </FieldGroup.Section>

        <FieldGroup.Section title="History">
          {[...order.statusHistory].reverse().map((entry) => (
            <ListItem key={`${entry.status}-${entry.at}`} supportingText={muted(`${formatOrderDate(entry.at)}${entry.note ? ` · ${entry.note}` : ''}`)}>
              {ORDER_STATUS_LABELS[entry.status]}
            </ListItem>
          ))}
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
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
});
