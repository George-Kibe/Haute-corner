import { Host } from '@expo/ui';
import { useEffect, useRef, useState, type ComponentProps, type ComponentRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { KeyboardEvents, useWindowDimensions } from 'react-native-keyboard-controller';

type FormHostProps = ComponentProps<typeof Host>;

/**
 * The `Host` for a full-screen form. Use it instead of `Host` wherever a form
 * has text fields, so the keyboard never covers the field being typed in.
 *
 * Android: the app is edge-to-edge, so the window no longer shrinks for the
 * keyboard and a Compose form stays full height behind it. This view lifts the
 * form's bottom edge above the keyboard in one step as the keyboard starts to
 * open, and the form's `LazyColumn` then scrolls the focused field into view
 * by itself. Shrinking it a little on every animation frame instead, as
 * `KeyboardAvoidingView` does, leaves the focused field behind the keyboard.
 *
 * iOS: SwiftUI forms already avoid the keyboard, so this view stays off there.
 * Resizing a SwiftUI form while a field has focus can also crash UIKit.
 */
export function FormHost({ style, ...props }: FormHostProps) {
  const view = useRef<ComponentRef<typeof View>>(null);
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = KeyboardEvents.addListener('keyboardWillShow', ({ height }) => {
      // Only count the part of the keyboard that overlaps this view. Padding
      // does not change the view's own frame, so this holds while it is open.
      view.current?.measureInWindow((_x, y, _width, viewHeight) => {
        const gapBelow = windowHeight - (y + viewHeight);
        setKeyboardInset(Math.max(0, height - gapBelow));
      });
    });
    const hide = KeyboardEvents.addListener('keyboardWillHide', () => setKeyboardInset(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [windowHeight]);

  return (
    <View ref={view} style={[styles.fill, { paddingBottom: keyboardInset }]}>
      <Host style={[styles.fill, style]} {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
