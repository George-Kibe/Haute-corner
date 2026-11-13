import CloseIcon from '@expo/material-symbols/close.xml';
import { FieldGroup, Picker, RNHostView, Text, TextInput } from '@expo/ui';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';

import { FormButton } from '@/components/form-button';
import { FormHost } from '@/components/form-host';
import { SITE_URL } from '@/constants/site';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { useMe } from '@/features/auth/queries';
import { useAppConfig } from '@/features/config/use-app-config';
import { MediaStrip } from '@/features/seller/media-strip';
import { pickPhotos } from '@/features/seller/pick-media';
import { useApplyToSell, useOwnSeller } from '@/features/seller/queries';
import type { DocumentKind } from '@/features/seller/types';
import { useMediaUploads } from '@/features/seller/use-media-uploads';
import { useColors } from '@/hooks/use-colors';

const isIOS = process.env.EXPO_OS === 'ios';

const ID_KINDS: { value: DocumentKind; label: string }[] = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
];

export default function ApplyScreen() {
  const colors = useColors();
  const { data: me } = useMe();
  const { data: previous } = useOwnSeller();
  const { data: config } = useAppConfig();
  const apply = useApplyToSell();
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const [idKind, setIdKind] = useState<DocumentKind>('national_id');
  const idPhotos = useMediaUploads([], 'document');
  const businessDocs = useMediaUploads([], 'document');

  // A rejected seller starts from their last application.
  const initial = {
    businessName: previous?.businessName ?? '',
    phone: previous?.phone ?? me?.phone ?? '',
    payoutMpesaNumber: previous?.payoutMpesaNumber ?? me?.phone ?? '',
    deliveryFee: previous ? String(previous.deliveryFee) : '',
    deliveryAreas: previous?.deliveryAreas ?? '',
    returnsNote: previous?.returnsNote ?? '',
  };
  // The native fields keep their own text, so the latest values are read on submit.
  const form = useRef(initial);
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  async function submit() {
    Keyboard.dismiss();
    if (idPhotos.uploading || businessDocs.uploading) {
      Toast.show({ type: 'info', text1: 'Your documents are still uploading' });
      return;
    }
    setErrors({ fields: {} });
    const { businessName, phone, payoutMpesaNumber, deliveryFee, deliveryAreas, returnsNote } = form.current;
    const fee = Number(deliveryFee.replace(/[,\s]/g, ''));
    if (deliveryFee.trim() === '' || !Number.isInteger(fee)) {
      setErrors({ fields: { deliveryFee: 'Enter the fee in whole shillings, such as 250' } });
      return;
    }
    try {
      await apply.mutateAsync({
        businessName,
        phone,
        payoutMpesaNumber,
        deliveryFee: fee,
        deliveryAreas,
        returnsNote,
        documents: [
          ...idPhotos.uploaded.map(({ publicId }) => ({ kind: idKind, publicId })),
          ...businessDocs.uploaded.map(({ publicId }) => ({ kind: 'business_registration' as const, publicId })),
        ],
      });
      router.back();
      Toast.show({ type: 'success', text1: 'Application sent', text2: 'We will email you once it is reviewed.' });
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
              autoComplete="tel"
              defaultValue={initial.phone}
              keyboardType="phone-pad"
              placeholder="Business phone, such as 0712 345 678"
              onChangeText={(value) => (form.current.phone = value)}
            />
            <FieldGroup.SectionFooter>
              <ErrorText>{errors.fields.businessName ?? errors.fields.phone}</ErrorText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Getting paid">
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
                muted('Your earnings are sent to this M-Pesa number after each order is delivered.')
              )}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Delivery">
            <TextInput
              accessibilityLabel="Delivery fee in shillings"
              defaultValue={initial.deliveryFee}
              keyboardType="number-pad"
              placeholder="Delivery fee in KES, such as 250"
              onChangeText={(value) => (form.current.deliveryFee = value)}
            />
            <TextInput
              accessibilityLabel="Delivery areas"
              defaultValue={initial.deliveryAreas}
              placeholder="Where you deliver, such as Nairobi and Kiambu"
              onChangeText={(value) => (form.current.deliveryAreas = value)}
            />
            <TextInput
              accessibilityLabel="Returns note"
              defaultValue={initial.returnsNote}
              multiline
              placeholder="Returns note, such as unworn items within 7 days (optional)"
              onChangeText={(value) => (form.current.returnsNote = value)}
            />
            <FieldGroup.SectionFooter>
              <ErrorText>{errors.fields.deliveryFee ?? errors.fields.deliveryAreas ?? errors.fields.returnsNote}</ErrorText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Identity">
            <Picker<DocumentKind> selectedValue={idKind} onValueChange={setIdKind} testID="id-kind-picker">
              {ID_KINDS.map((kind) => (
                <Picker.Item key={kind.value} label={kind.label} value={kind.value} />
              ))}
            </Picker>
            {idPhotos.items.length ? (
              <RNHostView matchContents={{ vertical: true }}>
                <MediaStrip items={idPhotos.items} onRemove={idPhotos.remove} />
              </RNHostView>
            ) : null}
            <FormButton
              label={idPhotos.items.length ? 'Add another photo' : 'Add a photo of your ID'}
              variant="link"
              onPress={async () => idPhotos.add('image', await pickPhotos(2 - idPhotos.items.length, config))}
            />
            <FieldGroup.SectionFooter>
              {errors.fields.documents ? (
                <ErrorText>{errors.fields.documents}</ErrorText>
              ) : (
                muted('Front and back if needed. Only HauteCorner staff can see it.')
              )}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Business registration (optional)">
            {businessDocs.items.length ? (
              <RNHostView matchContents={{ vertical: true }}>
                <MediaStrip items={businessDocs.items} onRemove={businessDocs.remove} />
              </RNHostView>
            ) : null}
            <FormButton
              label="Add a photo of your certificate"
              variant="link"
              onPress={async () => businessDocs.add('image', await pickPhotos(1 - businessDocs.items.length, config))}
            />
          </FieldGroup.Section>

          <FieldGroup.Section>
            <FormButton
              disabled={apply.isPending}
              label={apply.isPending ? 'Sending…' : 'Send application'}
              onPress={submit}
            />
            <FormButton
              label="Read the seller terms"
              variant="link"
              onPress={() => WebBrowser.openBrowserAsync(`${SITE_URL}/seller-terms`)}
            />
            <FieldGroup.SectionFooter>
              {errors.message ? <ErrorText>{errors.message}</ErrorText> : muted('By applying, you agree to the seller terms.')}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        </FieldGroup>
      </FormHost>
    </>
  );
}
