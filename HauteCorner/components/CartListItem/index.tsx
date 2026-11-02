import { Ionicons } from '@react-native-vector-icons/ionicons/static';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';

import { AppText } from '@/components/app-text';
import { useColors } from '@/hooks/use-colors';
import { formatPrice } from '@/lib/format';
import { cartSlice } from '@/store/cartSlice';

interface CartItemProps {
  cartItem: {
    product: {
      _id: string;
      title: string;
      price: number;
      images: string[];
    };
    quantity: number;
    size?: string;
  };
}

const CartListItem = ({ cartItem }: CartItemProps) => {
  const colors = useColors();
  const dispatch = useDispatch();

  const changeQuantity = (amount: number) => {
    dispatch(cartSlice.actions.changeQuantity({ productId: cartItem.product._id, amount }));
  };

  return (
    <View style={styles.container}>
      <Image
        contentFit="cover"
        source={{ uri: cartItem.product.images[0] }}
        style={[styles.image, { backgroundColor: colors.tint }]}
      />
      <View style={styles.contentContainer}>
        <AppText style={styles.name}>{cartItem.product.title}</AppText>
        {cartItem.size ? <AppText style={[styles.size, { color: colors.muted }]}>Size {cartItem.size}</AppText> : null}

        <View style={styles.footer}>
          <Ionicons
            accessible
            accessibilityRole="button"
            accessibilityLabel={cartItem.quantity <= 1 ? 'Remove from cart' : 'Decrease quantity'}
            color={cartItem.quantity <= 1 ? colors.danger : colors.muted}
            name={cartItem.quantity <= 1 ? 'trash' : 'remove-circle-outline'}
            onPress={() => changeQuantity(-1)}
            size={25}
          />
          <AppText style={[styles.quantity, { color: colors.muted }]}>{cartItem.quantity}</AppText>
          <Ionicons
            accessible
            accessibilityRole="button"
            accessibilityLabel="Increase quantity"
            color={colors.muted}
            name="add-circle-outline"
            onPress={() => changeQuantity(1)}
            size={25}
          />
          <AppText style={styles.itemTotal}>{formatPrice(cartItem.product.price * cartItem.quantity)}</AppText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 10,
  },
  image: {
    width: '40%',
    aspectRatio: 1,
    borderRadius: 12,
  },
  name: {
    fontWeight: '700',
    fontSize: 16,
  },
  size: {
    fontSize: 14,
  },
  quantity: {
    marginHorizontal: 10,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemTotal: {
    fontSize: 15,
    marginLeft: 'auto',
    fontWeight: '800',
  },
});

export default CartListItem;
