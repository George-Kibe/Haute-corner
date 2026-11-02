import { Button as SwiftUIButton, Host, Text } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled as disabledModifier, frame, tint } from '@expo/ui/swift-ui/modifiers';

import type { ButtonProps } from '@/components/button';
import { useColors } from '@/hooks/use-colors';

export function Button({ label, onPress, disabled }: ButtonProps) {
  const colors = useColors();

  return (
    <Host matchContents={{ vertical: true }} style={{ alignSelf: 'stretch' }}>
      <SwiftUIButton
        modifiers={[
          buttonStyle('borderedProminent'),
          controlSize('large'),
          tint(colors.primary),
          disabledModifier(!!disabled),
        ]}
        onPress={onPress}>
        <Text modifiers={[frame({ maxWidth: Number.MAX_SAFE_INTEGER })]}>{label}</Text>
      </SwiftUIButton>
    </Host>
  );
}
