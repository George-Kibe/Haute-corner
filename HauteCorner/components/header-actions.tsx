import Cart from '@expo/material-symbols/shopping_cart.xml';
import Orders from '@expo/material-symbols/package_2.xml';
import { router, Stack } from 'expo-router';
import type { ReactNode } from 'react';

import { useCartCount } from '@/features/cart/store';

const isIOS = process.env.EXPO_OS === 'ios';

// Native header buttons, which take on Liquid Glass on iOS 26+.
export function HeaderActions({ children, showOrders = true }: { children?: ReactNode; showOrders?: boolean }) {
  const itemsInCart = useCartCount();

  return (
    <Stack.Toolbar placement="right">
      {children}
      {showOrders ? (
        <Stack.Toolbar.Button
          accessibilityLabel="My orders"
          icon={isIOS ? 'shippingbox' : Orders}
          onPress={() => router.push('/orders')}
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
