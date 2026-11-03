import { FieldGroup, Host, ListItem } from '@expo/ui';
import { redacted } from '@expo/ui/swift-ui/modifiers';
import { StyleSheet } from 'react-native';

// SwiftUI's own placeholder: the real form layout, with its text drawn as grey bars.
export function ProfileSkeleton() {
  return (
    <Host accessibilityLabel="Loading your profile" style={styles.fill}>
      <FieldGroup modifiers={[redacted('placeholder')]}>
        <FieldGroup.Section title="Account">
          <ListItem supportingText="name@example.com">Your full name</ListItem>
        </FieldGroup.Section>
        <FieldGroup.Section title="Delivery">
          <ListItem supportingText="+254 700 000 000">Phone</ListItem>
          <ListItem supportingText="Street, area and town">Delivery address</ListItem>
        </FieldGroup.Section>
        <FieldGroup.Section title="About">
          <ListItem>Privacy policy</ListItem>
          <ListItem>Terms of use</ListItem>
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
