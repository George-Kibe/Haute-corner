import { Button, Text } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled as disabledModifier, frame, tint } from '@expo/ui/swift-ui/modifiers';

import type { FormButtonProps } from '@/components/form-button';
import { useColors } from '@/hooks/use-colors';

// A button row inside a FieldGroup, which is a SwiftUI Form on iOS. The main
// action is a full-width prominent button; others are tinted rows, as in Settings.
export function FormButton({ label, onPress, disabled, variant = 'primary' }: FormButtonProps) {
  const colors = useColors();
  const primary = variant === 'primary';

  return (
    <Button
      modifiers={[
        ...(primary ? [buttonStyle('borderedProminent'), controlSize('large')] : []),
        tint(colors.primary),
        disabledModifier(!!disabled),
      ]}
      onPress={onPress}>
      <Text modifiers={primary ? [frame({ maxWidth: Number.MAX_SAFE_INTEGER })] : []}>{label}</Text>
    </Button>
  );
}
