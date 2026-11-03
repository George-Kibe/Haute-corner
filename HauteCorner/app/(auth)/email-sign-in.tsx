import { FieldGroup, Host, TextInput } from '@expo/ui';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';

import { FormButton } from '@/components/form-button';
import { ErrorText, signedInToast, toFormErrors, useCloseAuth, type FormErrors } from '@/features/auth/auth-form';
import { signInWithEmail } from '@/features/auth/providers';

export default function EmailSignInScreen() {
  const closeAuth = useCloseAuth();
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
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
      await signInWithEmail(email, password);
      closeAuth();
      signedInToast();
    } catch (error) {
      setErrors(toFormErrors(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Host style={styles.fill}>
      <FieldGroup>
        <FieldGroup.Section title="Email">
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            defaultValue={email}
            keyboardType="email-address"
            placeholder="you@example.com"
            onChangeText={setEmail}
          />
          <FieldGroup.SectionFooter>
            <ErrorText>{errors.fields.email}</ErrorText>
          </FieldGroup.SectionFooter>
        </FieldGroup.Section>

        <FieldGroup.Section title="Password">
          <TextInput
            accessibilityLabel="Password"
            autoComplete="current-password"
            placeholder="Your password"
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
          <FormButton disabled={busy} label={busy ? 'Signing in…' : 'Sign in'} onPress={submit} />
          <FormButton
            label="Forgot your password?"
            variant="link"
            onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
          />
          <FormButton label="Create an account" variant="link" onPress={() => router.push('/sign-up')} />
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
