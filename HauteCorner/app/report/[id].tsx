import CloseIcon from '@expo/material-symbols/close.xml';
import { FieldGroup, Picker, Text, TextInput } from '@expo/ui';
import { useMutation } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';

import { FormButton } from '@/components/form-button';
import { FormHost } from '@/components/form-host';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { authRequest } from '@/features/auth/session';
import { SignInRequired } from '@/features/auth/sign-in-required';
import { useColors } from '@/hooks/use-colors';

const isIOS = process.env.EXPO_OS === 'ios';

type Reason = 'counterfeit' | 'prohibited' | 'misleading' | 'offensive' | 'scam' | 'other';

const REASONS: { value: Reason; label: string }[] = [
  { value: 'counterfeit', label: 'Counterfeit or fake brand' },
  { value: 'misleading', label: 'Photos or details are misleading' },
  { value: 'scam', label: 'Looks like a scam' },
  { value: 'prohibited', label: 'Not allowed on HauteCorner' },
  { value: 'offensive', label: 'Offensive' },
  { value: 'other', label: 'Something else' },
];

export default function ReportScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Report Listing', headerTransparent: false }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button accessibilityLabel="Cancel" icon={isIOS ? undefined : CloseIcon} onPress={() => router.back()}>
          <Stack.Toolbar.Label>Cancel</Stack.Toolbar.Label>
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <SignInRequired title="Report a listing" message="Sign in so our team can follow up on your report.">
        <ReportForm />
      </SignInRequired>
    </>
  );
}

function ReportForm() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [reason, setReason] = useState<Reason>('counterfeit');
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const details = useRef('');
  const send = useMutation({
    mutationFn: () => authRequest(`/products/${id}/reports`, { method: 'POST', body: { reason, details: details.current } }),
  });

  async function submit() {
    Keyboard.dismiss();
    try {
      await send.mutateAsync();
      router.back();
      Toast.show({ type: 'success', text1: 'Thanks for telling us', text2: 'Our team will review this listing.' });
    } catch (error) {
      setErrors(toFormErrors(error));
    }
  }

  return (
    <FormHost>
      <FieldGroup>
        <FieldGroup.Section title="What is wrong?">
          <Picker<Reason> selectedValue={reason} onValueChange={setReason} testID="report-reason">
            {REASONS.map((option) => (
              <Picker.Item key={option.value} label={option.label} value={option.value} />
            ))}
          </Picker>
          <TextInput
            accessibilityLabel="Details"
            multiline
            placeholder="Anything that helps us check (optional)"
            onChangeText={(value) => (details.current = value)}
          />
          <FieldGroup.SectionFooter>
            {errors.message || errors.fields.details ? (
              <ErrorText>{errors.message ?? errors.fields.details}</ErrorText>
            ) : (
              <Text textStyle={{ color: colors.muted }}>The seller will not see who reported it.</Text>
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>
        <FieldGroup.Section>
          <FormButton disabled={send.isPending} label={send.isPending ? 'Sending…' : 'Send report'} onPress={submit} />
        </FieldGroup.Section>
      </FieldGroup>
    </FormHost>
  );
}
