import CheckIcon from '@expo/material-symbols/check.xml';
import CloseIcon from '@expo/material-symbols/close.xml';
import { FieldGroup, Host, Text, TextInput } from '@expo/ui';
import { router, Stack } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { useMe, useUpdateMe } from '@/features/auth/queries';
import type { ProfileChanges, User } from '@/features/auth/types';
import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/lib/api-client';

const isIOS = process.env.EXPO_OS === 'ios';

export default function EditProfileScreen() {
  const { data: user } = useMe();
  return user ? <EditProfileForm user={user} /> : <ProfileSkeleton />;
}

function EditProfileForm({ user }: { user: User }) {
  const colors = useColors();
  const update = useUpdateMe();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const initial = {
    name: user.name ?? '',
    phone: user.phone ?? '',
    line1: user.deliveryAddress?.line1 ?? '',
    area: user.deliveryAddress?.area ?? '',
    city: user.deliveryAddress?.city ?? '',
    notes: user.deliveryAddress?.notes ?? '',
  };
  // The native fields keep their own text, so the latest values are only read on save.
  const form = useRef(initial);

  async function save() {
    // Close the keyboard first: a SwiftUI form that changes while one of its
    // fields has focus can crash UIKit.
    Keyboard.dismiss();
    const { name, phone, line1, area, city, notes } = form.current;
    const hasAddress = [line1, area, city, notes].some((value) => value.trim());
    const changes: ProfileChanges = {
      ...(name.trim() ? { name } : {}),
      phone: phone.trim() ? phone : null,
      deliveryAddress: hasAddress ? { line1, area, city, notes } : null,
    };

    try {
      await update.mutateAsync(changes);
      router.back();
      Toast.show({ type: 'success', text1: 'Your details are saved' });
    } catch (error) {
      setErrors(error instanceof ApiError ? (error.details ?? {}) : {});
      Toast.show({
        type: 'error',
        text1: 'Could not save your details',
        text2: error instanceof Error ? error.message : undefined,
      });
    }
  }

  const fieldError = (...fields: string[]) => fields.map((field) => errors[field]).find(Boolean);
  const errorText = (message: string | undefined) =>
    message ? <Text textStyle={{ color: colors.danger }}>{message}</Text> : null;
  const addressError = fieldError('deliveryAddress.line1', 'deliveryAddress.city', 'deliveryAddress.area', 'deliveryAddress.notes');

  return (
    <>
      <Stack.Toolbar placement="left">
        {/* Android header buttons show only icons. */}
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
      <Host style={styles.fill}>
        <FieldGroup>
          <FieldGroup.Section title="Name">
            <TextInput
              accessibilityLabel="Name"
              autoCapitalize="words"
              autoComplete="name"
              defaultValue={initial.name}
              placeholder="Your name"
              onChangeText={(value) => (form.current.name = value)}
            />
            <FieldGroup.SectionFooter>{errorText(fieldError('name'))}</FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Phone">
            <TextInput
              accessibilityLabel="Phone"
              autoComplete="tel"
              defaultValue={initial.phone}
              keyboardType="phone-pad"
              placeholder="0712 345 678"
              onChangeText={(value) => (form.current.phone = value)}
            />
            <FieldGroup.SectionFooter>
              {errorText(fieldError('phone')) ?? <Text>Sellers call this number to arrange delivery.</Text>}
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
              {errorText(addressError) ?? <Text>Leave every line empty to remove the address.</Text>}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>
        </FieldGroup>
      </Host>
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
