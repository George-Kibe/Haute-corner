import { FieldGroup, ListItem, Picker, Text, TextInput } from '@expo/ui';
import { Redirect, router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Keyboard } from 'react-native';

import { FormButton } from '@/components/form-button';
import { FormHost } from '@/components/form-host';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { useMe } from '@/features/auth/queries';
import { SignInRequired } from '@/features/auth/sign-in-required';
import type { User } from '@/features/auth/types';
import { newIdempotencyKey, useCheckout, useQuote } from '@/features/cart/queries';
import { toCartItems, useCart } from '@/features/cart/store';
import { useColors } from '@/hooks/use-colors';
import { countItems, formatPrice } from '@/lib/format';

type Method = 'mpesa' | 'card';

export default function CheckoutScreen() {
  return (
    <SignInRequired title="Sign in to check out" message="Your cart is kept on this phone while you sign in.">
      <CheckoutLoader />
    </SignInRequired>
  );
}

function CheckoutLoader() {
  const { data: user } = useMe();
  return user ? <CheckoutForm user={user} /> : <ProfileSkeleton />;
}

function CheckoutForm({ user }: { user: User }) {
  const colors = useColors();
  const lines = useCart((state) => state.lines);
  const items = useMemo(() => toCartItems(lines), [lines]);
  const quote = useQuote(items);
  const checkout = useCheckout();
  const [method, setMethod] = useState<Method>('mpesa');
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  // One key for this checkout, so tapping Pay twice or retrying after a
  // dropped connection cannot create two purchases.
  const idempotencyKey = useRef(newIdempotencyKey());
  const initial = {
    name: user.name ?? '',
    phone: user.phone ?? '',
    line1: user.deliveryAddress?.line1 ?? '',
    area: user.deliveryAddress?.area ?? '',
    city: user.deliveryAddress?.city ?? '',
    notes: user.deliveryAddress?.notes ?? '',
  };
  // Kept in state so the number survives switching to card and back.
  const [mpesaPhone, setMpesaPhone] = useState(user.phone ?? '');
  const form = useRef(initial);
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  async function pay() {
    Keyboard.dismiss();
    setErrors({ fields: {} });
    const { name, phone, line1, area, city, notes } = form.current;
    try {
      const purchase = await checkout.mutateAsync({
        idempotencyKey: idempotencyKey.current,
        request: {
          items,
          contact: { name, phone },
          deliveryAddress: { line1, city, ...(area.trim() && { area }), ...(notes.trim() && { notes }) },
          payment: method === 'mpesa' ? { method, phone: mpesaPhone } : { method },
        },
      });
      router.replace({ pathname: '/purchase/[ref]', params: { ref: purchase.ref } });
    } catch (error) {
      const next = toFormErrors(error);
      setErrors(next);
      // Nothing was created when the request was refused, so a fresh key is
      // safe, and needed if the cart changes.
      idempotencyKey.current = newIdempotencyKey();
    }
  }

  const field = (...names: string[]) => names.map((name) => errors.fields[name]).find(Boolean);

  if (lines.length === 0) return <Redirect href="/shopping-cart" />;

  return (
    <FormHost>
      <FieldGroup>
        <FieldGroup.Section title="Your order">
          {quote.data ? (
            quote.data.orders.map((order) => (
              <ListItem
                key={order.seller.id}
                supportingText={muted(
                  `${countItems(order.items.reduce((sum, item) => sum + item.quantity, 0))} · delivery ${formatPrice(order.deliveryFee)}`,
                )}
                trailing={<Text>{formatPrice(order.total)}</Text>}>
                {order.seller.name}
              </ListItem>
            ))
          ) : (
            <Text>{quote.error ? quote.error.message : 'Checking prices…'}</Text>
          )}
          <FieldGroup.SectionFooter>
            {muted('Each seller arranges their own delivery and will call you on the number below.')}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Contact">
          <TextInput
            accessibilityLabel="Name"
            autoComplete="name"
            defaultValue={initial.name}
            placeholder="Your name"
            onChangeText={(value) => (form.current.name = value)}
          />
          <TextInput
            accessibilityLabel="Phone"
            autoComplete="tel"
            defaultValue={initial.phone}
            keyboardType="phone-pad"
            placeholder="Phone, such as 0712 345 678"
            onChangeText={(value) => (form.current.phone = value)}
          />
          <FieldGroup.SectionFooter>
            <ErrorText>{field('contact.name', 'contact.phone')}</ErrorText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Delivery address">
          <TextInput
            accessibilityLabel="Street and building"
            autoComplete="street-address"
            defaultValue={initial.line1}
            placeholder="Street, building and house number"
            onChangeText={(value) => (form.current.line1 = value)}
          />
          <TextInput
            accessibilityLabel="Area"
            defaultValue={initial.area}
            placeholder="Area, such as Kilimani (optional)"
            onChangeText={(value) => (form.current.area = value)}
          />
          <TextInput
            accessibilityLabel="Town or city"
            defaultValue={initial.city}
            placeholder="Town or city"
            onChangeText={(value) => (form.current.city = value)}
          />
          <TextInput
            accessibilityLabel="Directions"
            defaultValue={initial.notes}
            multiline
            placeholder="Directions for the rider (optional)"
            onChangeText={(value) => (form.current.notes = value)}
          />
          <FieldGroup.SectionFooter>
            <ErrorText>{field('deliveryAddress.line1', 'deliveryAddress.city', 'deliveryAddress.area', 'deliveryAddress.notes')}</ErrorText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Payment">
          <Picker<Method> selectedValue={method} testID="payment-method" onValueChange={setMethod}>
            <Picker.Item label="M-Pesa" value="mpesa" />
            <Picker.Item label="Card" value="card" />
          </Picker>
          {method === 'mpesa' ? (
            <TextInput
              accessibilityLabel="M-Pesa number"
              defaultValue={mpesaPhone}
              keyboardType="phone-pad"
              placeholder="M-Pesa number to pay from"
              onChangeText={setMpesaPhone}
            />
          ) : null}
          <FieldGroup.SectionFooter>
            {field('payment.phone') ? (
              <ErrorText>{field('payment.phone')}</ErrorText>
            ) : (
              muted(
                method === 'mpesa'
                  ? 'You will get a prompt on this phone to enter your M-Pesa PIN.'
                  : 'You pay on Paystack’s secure page. Your card details never reach HauteCorner.',
              )
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <FormButton
            disabled={!quote.data || checkout.isPending}
            label={checkout.isPending ? 'Starting payment…' : quote.data ? `Pay ${formatPrice(quote.data.total)}` : 'Pay'}
            onPress={pay}
          />
          <FieldGroup.SectionFooter>
            {errors.message ? (
              <ErrorText>{errors.message}</ErrorText>
            ) : (
              muted('HauteCorner holds your payment until you receive your order.')
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
      </FieldGroup>
    </FormHost>
  );
}
