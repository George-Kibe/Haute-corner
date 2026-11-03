import { FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { router } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { FormButton } from '@/components/form-button';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { startEmailSignUp } from '@/features/auth/providers';
import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/lib/api-client';

export default function SignUpScreen() {
  const colors = useColors();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const [accountExists, setAccountExists] = useState(false);

  async function submit() {
    if (busy) return;
    // Close the keyboard first: a SwiftUI form that changes while one of its
    // fields has focus can crash UIKit.
    Keyboard.dismiss();
    setBusy(true);
    setErrors({ fields: {} });
    setAccountExists(false);
    try {
      const sent = await startEmailSignUp({ name, email, password });
      router.push({
        pathname: '/verify-email',
        params: { email: sent.email, resendAfter: String(sent.resendAfterSeconds) },
      });
    } catch (error) {
      setAccountExists(error instanceof ApiError && error.code === 'account_exists');
      setErrors(toFormErrors(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        <FieldGroup.Section title="Name">
          <TextInput
            accessibilityLabel="Name"
            autoCapitalize="words"
            autoComplete="name"
            placeholder="Your name"
            onChangeText={setName}
          />
          <FieldGroup.SectionFooter>
            <ErrorText>{errors.fields.name}</ErrorText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Email">
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            onChangeText={setEmail}
          />
          <FieldGroup.SectionFooter>
            {errors.fields.email ? (
              <ErrorText>{errors.fields.email}</ErrorText>
            ) : (
              <Text textStyle={{ color: colors.muted }}>We will email you a code to confirm it.</Text>
            )}
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Password">
          <TextInput
            accessibilityLabel="Password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            returnKeyType="go"
            secureTextEntry
            onChangeText={setPassword}
            onSubmitEditing={submit}
          />
          <FieldGroup.SectionFooter>
            <ErrorText>{errors.fields.password ?? errors.message}</ErrorText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section>
          <FormButton disabled={busy} label={busy ? 'Sending code…' : 'Create account'} onPress={submit} />
          {accountExists ? (
            <FormButton
              label="Sign in instead"
              variant="link"
              onPress={() => router.replace({ pathname: '/email-sign-in', params: { email } })}
            />
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
});
