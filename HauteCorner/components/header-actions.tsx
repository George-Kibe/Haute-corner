import Cart from '@expo/material-symbols/shopping_cart.xml';
import TrackOrder from '@expo/material-symbols/package_2.xml';
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectedNumberOfItems } from '@/store/cartSlice';

const isIOS = process.env.EXPO_OS === 'ios';

// Native header buttons, which take on Liquid Glass on iOS 26+.
export function HeaderActions({ children, showTrackOrder = true }: { children?: ReactNode; showTrackOrder?: boolean }) {
  const itemsInCart = useSelector(selectedNumberOfItems);

  return (
    <Stack.Toolbar placement="right">
      {children}
      {showTrackOrder ? (
        <Stack.Toolbar.Button
          accessibilityLabel="Track order"
          icon={isIOS ? 'shippingbox' : TrackOrder}
          onPress={() => router.push('/track-order')}
        />
      ) : null}
      <Stack.Toolbar.Button
        accessibilityLabel="My cart"
        icon={isIOS ? 'cart' : Cart}
        onPress={() => router.push('/shopping-cart')}>
        {itemsInCart > 0 ? <Stack.Toolbar.Badge>{String(itemsInCart)}</Stack.Toolbar.Badge> : null}
      </Stack.Toolbar.Button>
    </Stack.Toolbar>
  );
}
