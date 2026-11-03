import { FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

import { FormButton } from '@/components/form-button';
import { ErrorText, toFormErrors, useCloseAuth, useCountdown, type FormErrors } from '@/features/auth/auth-form';
import { requestPasswordReset, resetPassword } from '@/features/auth/providers';
import { useColors } from '@/hooks/use-colors';

export default function ResetPasswordScreen() {
  const colors = useColors();
  const closeAuth = useCloseAuth();
  const { email, resendAfter } = useLocalSearchParams<{ email: string; resendAfter?: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const [notice, setNotice] = useState<string | null>(null);
  const [wait, setWait] = useCountdown(Number(resendAfter ?? 60));

  async function submit() {
    if (busy) return;
    // Close the keyboard first: a SwiftUI form that changes while one of its
    // fields has focus can crash UIKit.
    Keyboard.dismiss();
    setBusy(true);
    setErrors({ fields: {} });
    try {
      await resetPassword(email, code.trim(), password);
      closeAuth();
      Toast.show({ type: 'success', text1: 'Your new password is saved', text2: 'Other devices have been signed out' });
    } catch (error) {
      setErrors(toFormErrors(error));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setErrors({ fields: {} });
    try {
      const sent = await requestPasswordReset(email);
      setWait(sent.resendAfterSeconds);
      setNotice('If the address has an account, a new code is on its way.');
    } catch (error) {
      setErrors(toFormErrors(error));
    }
  }

  const codeError = errors.fields.code ?? (errors.fields.password ? undefined : errors.message);

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
            onChangeText={setCode}
          />
          <FieldGroup.SectionFooter>
            {codeError ? (
              <ErrorText>{codeError}</ErrorText>
            ) : (
              <Text textStyle={{ color: colors.muted }}>
                {notice ?? 'If the address has an account, a code is on its way. It works for 10 minutes.'}
              </Text>
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="New password">
          <TextInput
            accessibilityLabel="New password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            returnKeyType="go"
            secureTextEntry
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          <FieldGroup.SectionFooter>
            {errors.fields.password ? (
              <ErrorText>{errors.fields.password}</ErrorText>
            ) : (
              <Text textStyle={{ color: colors.muted }}>Saving it signs you out on your other devices.</Text>
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <FormButton disabled={busy} label={busy ? 'Saving…' : 'Save new password'} onPress={submit} />
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
