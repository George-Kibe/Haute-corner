import { Button, Text, TextButton } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { useColors } from '@/hooks/use-colors';

export type FormButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'link';
};

// A button inside a FieldGroup, which is Jetpack Compose on Android: a
// full-width filled button for the main action, and text buttons for others.
export function FormButton({ label, onPress, disabled, variant = 'primary' }: FormButtonProps) {
  const colors = useColors();

  if (variant === 'link') {
    return (
      <TextButton colors={{ contentColor: colors.primary }} enabled={!disabled} onClick={onPress}>
        <Text>{label}</Text>
      </TextButton>
    );
  }
  return (
    <Button
      colors={{ containerColor: colors.primary, contentColor: colors.onPrimary }}
      enabled={!disabled}
      modifiers={[fillMaxWidth()]}
      onClick={onPress}>
      <Text>{label}</Text>
    </Button>
  );
}
