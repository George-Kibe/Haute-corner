import { FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { FormButton } from '@/components/form-button';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { requestPasswordReset } from '@/features/auth/providers';
import { useColors } from '@/hooks/use-colors';

// Also used from Profile to change or add a password, with the email filled in.
export default function ForgotPasswordScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{ email?: string; change?: string }>();
  const changing = params.change === '1';
  const [email, setEmail] = useState(params.email ?? '');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });

  async function submit() {
    if (busy) return;
    // Close the keyboard first: a SwiftUI form that changes while one of its
    // fields has focus can crash UIKit.
    Keyboard.dismiss();
    setBusy(true);
    setErrors({ fields: {} });
    try {
      const sent = await requestPasswordReset(email);
      router.push({
        pathname: '/reset-password',
        params: { email: sent.email, resendAfter: String(sent.resendAfterSeconds) },
      });
    } catch (error) {
      setErrors(toFormErrors(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Host style={styles.fill}>
      <Stack.Screen options={{ title: changing ? 'Change Password' : 'Reset Password' }} />
      <FieldGroup>
        <FieldGroup.Section title="Email">
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            defaultValue={email}
            editable={!changing}
            keyboardType="email-address"
            placeholder="you@example.com"
            returnKeyType="send"
            onChangeText={setEmail}
            onSubmitEditing={submit}
          />
          <FieldGroup.SectionFooter>
            {errors.fields.email || errors.message ? (
              <ErrorText>{errors.fields.email ?? errors.message}</ErrorText>
            ) : (
              <Text textStyle={{ color: colors.muted }}>
                We will email a code to this address if it has a HauteCorner account.
              </Text>
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <FormButton disabled={busy} label={busy ? 'Sending code…' : 'Send code'} onPress={submit} />
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
