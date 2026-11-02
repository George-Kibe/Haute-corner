import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { useColors } from '@/hooks/use-colors';

type StateMessageProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function StateMessage({ title, message, actionLabel, onAction }: StateMessageProps) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <AppText style={styles.title}>{title}</AppText>
      {message ? <AppText style={[styles.message, { color: colors.muted }]}>{message}</AppText> : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
});
