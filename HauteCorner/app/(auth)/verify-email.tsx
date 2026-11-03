import { FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import {
  ErrorText,
  signedInToast,
  toFormErrors,
  useCloseAuth,
  useCountdown,
  type FormErrors,
} from '@/features/auth/auth-form';
import { FormButton } from '@/components/form-button';
import { resendCode, verifyEmail } from '@/features/auth/providers';
import { useColors } from '@/hooks/use-colors';

export default function VerifyEmailScreen() {
  const colors = useColors();
  const closeAuth = useCloseAuth();
  const { email, resendAfter } = useLocalSearchParams<{ email: string; resendAfter?: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useCountdown(Number(resendAfter ?? 60));

  async function submit(value = code) {
    if (busy) return;
    // Close the keyboard first: a SwiftUI form that changes while one of its
    // fields has focus can crash UIKit.
    Keyboard.dismiss();
    setBusy(true);
    setErrors({ fields: {} });
    try {
      await verifyEmail(email, value);
      closeAuth();
      signedInToast();
    } catch (error) {
      setErrors(toFormErrors(error));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErrors({ fields: {} });
    setNotice(null);
    try {
      const sent = await resendCode(email, 'signup');
      setWait(sent.resendAfterSeconds);
      setNotice('We sent a new code.');
    } catch (error) {
      setErrors(toFormErrors(error));
    }
  }

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        <FieldGroup.Section title={`Code sent to ${email}`}>
          <TextInput
            accessibilityLabel="Code"
            autoComplete="one-time-code"
            autoFocus
            keyboardType="number-pad"
            placeholder="6-digit code"
            onChangeText={(value) => {
              setCode(value);
              // Sends as soon as the sixth digit is typed or pasted.
              if (/^\d{6}$/.test(value.trim())) submit(value.trim());
            }}
          />
          <FieldGroup.SectionFooter>
            {errors.fields.code || errors.message ? (
              <ErrorText>{errors.fields.code ?? errors.message}</ErrorText>
            ) : (
              <Text textStyle={{ color: colors.muted }}>
                {notice ?? 'Check your inbox, and your spam folder. The code works for 10 minutes.'}
              </Text>
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <FormButton disabled={busy} label={busy ? 'Checking…' : 'Confirm'} onPress={() => submit()} />
          <FormButton
            disabled={wait > 0}
            label={wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
            variant="link"
            onPress={resend}
          />
        </FieldGroup.Section>
      </FieldGroup>
    </Host>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
