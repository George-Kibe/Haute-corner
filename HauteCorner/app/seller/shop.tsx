import CheckIcon from '@expo/material-symbols/check.xml';
import CloseIcon from '@expo/material-symbols/close.xml';
import { FieldGroup, Text, TextInput } from '@expo/ui';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';

import { FormHost } from '@/components/form-host';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { useOwnSeller, useUpdateShop } from '@/features/seller/queries';
import type { OwnSeller } from '@/features/seller/types';
import { useColors } from '@/hooks/use-colors';

const isIOS = process.env.EXPO_OS === 'ios';

export default function ShopScreen() {
  const { data: seller } = useOwnSeller();
  return seller ? <ShopForm seller={seller} /> : <ProfileSkeleton />;
}

function ShopForm({ seller }: { seller: OwnSeller }) {
  const colors = useColors();
  const update = useUpdateShop();
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const initial = {
    businessName: seller.businessName,
    phone: seller.phone,
    payoutMpesaNumber: seller.payoutMpesaNumber,
    deliveryFee: String(seller.deliveryFee),
    deliveryAreas: seller.deliveryAreas,
    returnsNote: seller.returnsNote ?? '',
  };
  const form = useRef(initial);
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  async function save() {
    Keyboard.dismiss();
    const fee = Number(form.current.deliveryFee.replace(/[,\s]/g, ''));
    if (form.current.deliveryFee.trim() === '' || !Number.isInteger(fee)) {
      setErrors({ fields: { deliveryFee: 'Enter the fee in whole shillings, such as 250' } });
      return;
    }
    // Only changed fields are sent, so an unchanged payout number is never re-reviewed.
    const next = { ...form.current, deliveryFee: fee, returnsNote: form.current.returnsNote.trim() || null };
    const before = { ...initial, deliveryFee: seller.deliveryFee, returnsNote: seller.returnsNote };
    const changes = Object.fromEntries(
      Object.entries(next).filter(([key, value]) => value !== before[key as keyof typeof before]),
    );
    if (Object.keys(changes).length === 0) {
      router.back();
      return;
    }
    try {
      const updated = await update.mutateAsync(changes);
      router.back();
      Toast.show({
        type: 'success',
        text1: 'Shop settings saved',
        text2: updated.payoutNumberUnderReview ? 'Payouts pause until we confirm your new M-Pesa number.' : undefined,
      });
    } catch (error) {
      setErrors(toFormErrors(error));
    }
  }

  return (
    <>
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button accessibilityLabel="Cancel" icon={isIOS ? undefined : CloseIcon} onPress={() => router.back()}>
          <Stack.Toolbar.Label>Cancel</Stack.Toolbar.Label>
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Save"
          disabled={update.isPending}
          icon={isIOS ? undefined : CheckIcon}
          variant="done"
          onPress={save}>
          <Stack.Toolbar.Label>Save</Stack.Toolbar.Label>
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <FormHost>
        <FieldGroup>
          <FieldGroup.Section title="Your shop">
            <TextInput
              accessibilityLabel="Business name"
              autoCapitalize="words"
              defaultValue={initial.businessName}
              placeholder="Business name"
              onChangeText={(value) => (form.current.businessName = value)}
            />
            <TextInput
              accessibilityLabel="Business phone"
              defaultValue={initial.phone}
              keyboardType="phone-pad"
              placeholder="Business phone"
              onChangeText={(value) => (form.current.phone = value)}
            />
            <FieldGroup.SectionFooter>
              <ErrorText>{errors.fields.businessName ?? errors.fields.phone}</ErrorText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="M-Pesa payout number">
            <TextInput
              accessibilityLabel="M-Pesa payout number"
              defaultValue={initial.payoutMpesaNumber}
              keyboardType="phone-pad"
              placeholder="M-Pesa number"
              onChangeText={(value) => (form.current.payoutMpesaNumber = value)}
            />
            <FieldGroup.SectionFooter>
              {errors.fields.payoutMpesaNumber ? (
                <ErrorText>{errors.fields.payoutMpesaNumber}</ErrorText>
              ) : (
                muted(
                  seller.payoutNumberUnderReview
                    ? 'We are confirming this number. Payouts resume once we have.'
                    : 'Changing it pauses payouts until we confirm the new number, to protect your earnings.',
                )
              )}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Delivery">
            <TextInput
              accessibilityLabel="Delivery fee in shillings"
              defaultValue={initial.deliveryFee}
              keyboardType="number-pad"
              placeholder="Delivery fee in KES"
              onChangeText={(value) => (form.current.deliveryFee = value)}
            />
            <TextInput
              accessibilityLabel="Delivery areas"
              defaultValue={initial.deliveryAreas}
              placeholder="Where you deliver"
              onChangeText={(value) => (form.current.deliveryAreas = value)}
            />
            <TextInput
              accessibilityLabel="Returns note"
              defaultValue={initial.returnsNote}
              multiline
              placeholder="Returns note (optional)"
              onChangeText={(value) => (form.current.returnsNote = value)}
            />
            <FieldGroup.SectionFooter>
              <ErrorText>
                {errors.fields.deliveryFee ?? errors.fields.deliveryAreas ?? errors.fields.returnsNote ?? errors.message}
              </ErrorText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        </FieldGroup>
      </FormHost>
    </>
  );
}
