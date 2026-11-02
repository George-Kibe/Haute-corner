import { Button as ComposeButton, Host, Text } from '@expo/ui/jetpack-compose';
import { fillMaxWidth } from '@expo/ui/jetpack-compose/modifiers';

import { useColors } from '@/hooks/use-colors';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export function Button({ label, onPress, disabled }: ButtonProps) {
  const colors = useColors();

  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: 'stretch' }}>
      <ComposeButton
        colors={{ containerColor: colors.primary, contentColor: colors.onPrimary }}
        enabled={!disabled}
        modifiers={[fillMaxWidth()]}
        onClick={onPress}>
        <Text>{label}</Text>
      </ComposeButton>
    </Host>
  );
}
