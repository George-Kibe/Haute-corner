import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ProductImage } from '@/features/products/product-image';
import { firstImage, type Product } from '@/features/products/types';
import { useColors } from '@/hooks/use-colors';
import { formatPrice } from '@/lib/format';

export function ProductCard({ product, imageWidth }: { product: Product; imageWidth: number }) {
  const colors = useColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${product.title}, ${formatPrice(product.price)}`}
      onPress={() => router.push({ pathname: '/products/[id]', params: { id: product.id } })}
      style={styles.card}>
      <View>
        <ProductImage publicId={firstImage(product)?.publicId} layoutWidth={imageWidth} style={styles.image} />
        {product.stock === 0 ? (
          <View style={[styles.badge, { backgroundColor: colors.background }]}>
            <AppText style={styles.badgeText}>Sold out</AppText>
          </View>
        ) : null}
      </View>
      <AppText numberOfLines={2} style={styles.title}>
        {product.title}
      </AppText>
      <AppText style={[styles.price, { color: colors.primary }]}>{formatPrice(product.price)}</AppText>
      <AppText numberOfLines={1} style={[styles.seller, { color: colors.muted }]}>
        {product.seller.name}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 8,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  price: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '800',
  },
  seller: {
    marginTop: 2,
    fontSize: 13,
  },
});
