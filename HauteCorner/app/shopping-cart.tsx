import { FieldGroup, Host, ListItem, Picker, Text } from '@expo/ui';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { FormButton } from '@/components/form-button';
import { StateMessage } from '@/components/state-message';
import { useSession } from '@/features/auth/session';
import { openSignIn } from '@/features/auth/sign-in-required';
import { useQuote } from '@/features/cart/queries';
import { groupBySeller, MAX_QUANTITY, setQuantity, toCartItems, useCart, type CartLine } from '@/features/cart/store';
import { useAppConfig } from '@/features/config/use-app-config';
import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { imageUrl } from '@/lib/media';

// Quantity choices: up to what is in stock, plus Remove.
function quantityChoices(line: CartLine) {
  const most = Math.max(line.quantity, Math.min(line.stock, MAX_QUANTITY));
  return [0, ...Array.from({ length: most }, (_, index) => index + 1)];
}

export default function CartScreen() {
  const colors = useColors();
  const lines = useCart((state) => state.lines);
  const signedIn = useSession((state) => state.status === 'signedIn');
  const { data: config } = useAppConfig();
  const items = useMemo(() => toCartItems(lines), [lines]);
  const quote = useQuote(items);
  const groups = groupBySeller(lines);
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;
  const danger = (text: string) => <Text textStyle={{ color: colors.danger }}>{text}</Text>;

  if (lines.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <StateMessage
          title="Your cart is empty"
          message="Add shoes and clothing from any seller. You can buy from several sellers at once."
          actionLabel="Start shopping"
          onAction={() => router.replace('/categories')}
        />
      </View>
    );
  }

  // The server reports problems per cart line.
  const lineErrors = quote.error instanceof ApiError ? (quote.error.details ?? {}) : {};
  const errorFor = (line: CartLine) => lineErrors[`items.${lines.indexOf(line)}`];
  const blocked = Object.keys(lineErrors).length > 0;
  const totals = quote.data;
  // Signed out, totals come from the prices shown when items were added.
  const estimate = groups.reduce(
    (sum, group) => sum + group.deliveryFee + group.lines.reduce((lineSum, line) => lineSum + line.price * line.quantity, 0),
    0,
  );

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        {groups.map((group) => {
          const priced = totals?.orders.find((order) => order.seller.id === group.sellerId);
          return (
            <FieldGroup.Section key={group.sellerId} title={`From ${group.sellerName}`}>
              {group.lines.map((line) => {
                const error = errorFor(line);
                const price = priced?.items.find((item) => item.productId === line.productId && (item.option ?? undefined) === line.option)?.unitPrice ?? line.price;
                return [
                  <ListItem
                    key={line.key}
                    leading={
                      line.image && config ? (
                        <Image contentFit="cover" source={imageUrl(config.cloudinaryCloudName, line.image, 200)} style={styles.thumbnail} />
                      ) : undefined
                    }
                    supportingText={error ? danger(error) : muted(`${line.option ? `Size ${line.option} · ` : ''}${formatPrice(price)}`)}
                    onPress={() => router.push({ pathname: '/products/[id]', params: { id: line.productId } })}>
                    {line.title}
                  </ListItem>,
                  <Picker<number>
                    key={`${line.key}-quantity`}
                    selectedValue={line.quantity}
                    testID={`quantity-${line.key}`}
                    onValueChange={(quantity) => setQuantity(line.key, quantity)}>
                    {quantityChoices(line).map((quantity) => (
                      <Picker.Item key={quantity} label={quantity === 0 ? 'Remove' : `Quantity: ${quantity}`} value={quantity} />
                    ))}
                  </Picker>,
                ];
              })}
              <FieldGroup.SectionFooter>
                {muted(`Delivery from ${group.sellerName}: ${formatPrice(priced?.deliveryFee ?? group.deliveryFee)}`)}
              </FieldGroup.SectionFooter>
            </FieldGroup.Section>
          );
        })}

        <FieldGroup.Section title="Total">
          {totals ? (
            <>
              <ListItem supportingText={muted(formatPrice(totals.subtotal))}>Items</ListItem>
              <ListItem supportingText={muted(formatPrice(totals.deliveryTotal))}>Delivery</ListItem>
              <ListItem supportingText={<Text textStyle={{ fontWeight: '800' }}>{formatPrice(totals.total)}</Text>}>To pay</ListItem>
            </>
          ) : (
            <ListItem supportingText={muted(signedIn && quote.isFetching ? 'Checking prices…' : `About ${formatPrice(estimate)}`)}>To pay</ListItem>
          )}
          {signedIn ? (
            <FormButton disabled={!totals || blocked} label="Check out" onPress={() => router.push('/checkout')} />
          ) : (
            <FormButton label="Sign in to check out" onPress={openSignIn} />
          )}
          <FieldGroup.SectionFooter>
            {blocked
              ? danger('Change or remove the items marked above to continue.')
              : quote.error && !blocked
                ? danger(quote.error.message)
                : muted('Each seller delivers their own items. You pay once, and your money reaches each seller only after delivery.')}
          </FieldGroup.SectionFooter>
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
