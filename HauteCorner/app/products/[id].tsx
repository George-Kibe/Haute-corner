import { PagerView } from '@expo/ui/community/pager-view';
import { Host, Picker } from '@expo/ui';
import { FormButton } from '@/components/form-button';
import Star from '@expo/material-symbols/star.xml';
// The package ships outlined icons only, so the filled star is kept in the app.
import StarFilled from '@/assets/icons/star_fill.xml';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { HeaderActions } from '@/components/header-actions';
import { StateMessage } from '@/components/state-message';
import { ProductImage } from '@/features/products/product-image';
import { ProductVideo } from '@/features/products/product-video';
import { useProduct } from '@/features/products/queries';
import { ProductDetailsSkeleton } from '@/features/products/skeletons';
import type { Product } from '@/features/products/types';
import { addToCart as addLineToCart } from '@/features/cart/store';
import { useIsLiked } from '@/features/wishlist/store';
import { toggleLike } from '@/features/wishlist/sync';
import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';

function ProductDetails({ product }: { product: Product }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [selectedOption, setSelectedOption] = useState(product.options[0]);
  const liked = useIsLiked(product.id);

  const images = product.media.filter((item) => item.kind === 'image');
  const video = product.media.find((item) => item.kind === 'video');
  const soldOut = product.stock === 0;
  // In landscape-shaped windows the image sits beside the details, so it never fills the screen.
  const wide = width > height;
  const imageSize = wide ? Math.min((width - insets.left - insets.right) / 2, height * 0.75) : width;

  const addToCart = () => {
    const option = product.options.length > 0 ? selectedOption : undefined;
    if (!addLineToCart(product, option)) {
      Toast.show({ type: 'info', text1: 'That is all we have', text2: `Only ${product.stock} in stock` });
      return;
    }
    Toast.show({ type: 'success', text1: 'Added to cart', text2: option ? `${product.title}, size ${option}` : product.title });
  };

  const toggleLiked = async () => {
    try {
      const nowLiked = await toggleLike(product.id);
      Toast.show({ type: 'success', text1: nowLiked ? 'Saved to your wish list' : 'Removed from your wish list' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Could not update your wish list',
        text2: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}>
      <HeaderActions showOrders={false}>
        <Stack.Toolbar.Button
          accessibilityLabel={liked ? 'Remove from wish list' : 'Save to wish list'}
          icon={process.env.EXPO_OS === 'ios' ? (liked ? 'star.fill' : 'star') : liked ? StarFilled : Star}
          tintColor={liked ? colors.primary : undefined}
          onPress={toggleLiked}
        />
      </HeaderActions>

      <View style={wide ? [styles.wide, { paddingLeft: insets.left, paddingRight: insets.right }] : undefined}>
        <PagerView initialPage={0} style={{ width: imageSize, height: imageSize }}>
          {images.map((item) => (
            <View key={item.publicId} collapsable={false}>
              <ProductImage
                accessibilityLabel={product.title}
                layoutWidth={imageSize}
                publicId={item.publicId}
                style={[{ width: imageSize, height: imageSize }, wide && styles.wideImage]}
              />
            </View>
          ))}
        </PagerView>

        <View style={[styles.body, wide && styles.wideBody]}>
          <AppText style={styles.title}>{product.title}</AppText>
          <AppText style={[styles.price, { color: colors.primary }]}>{formatPrice(product.price)}</AppText>
          <AppText style={[styles.meta, { color: colors.muted }]}>
            Sold by {product.seller.name} · Delivery {formatPrice(product.seller.deliveryFee)}
          </AppText>
          {soldOut ? <AppText style={[styles.stock, { color: colors.danger }]}>Sold out</AppText> : null}

          {product.options.length > 0 ? (
            <View style={[styles.options, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText style={styles.optionsLabel}>Size</AppText>
              <Host matchContents>
                <Picker<string>
                  appearance="menu"
                  enabled={!soldOut}
                  onValueChange={setSelectedOption}
                  selectedValue={selectedOption}
                  testID="size-picker">
                  {product.options.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </Host>
            </View>
          ) : null}

          <Button disabled={soldOut} label={soldOut ? 'Sold out' : 'Add to cart'} onPress={addToCart} />

          {video ? (
            <>
              <AppText style={styles.heading}>Video</AppText>
              <ProductVideo layoutWidth={wide ? width - imageSize - insets.left - insets.right - 56 : width - 32} video={video} />
            </>
          ) : null}

          <AppText style={styles.heading}>About this product</AppText>
          <AppText style={[styles.description, { color: colors.muted }]}>{product.description}</AppText>

          <Host matchContents style={styles.report}>
            <FormButton
              label="Report this listing"
              variant="link"
              onPress={() => router.push({ pathname: '/report/[id]', params: { id: product.id } })}
            />
          </Host>
        </View>
      </View>
    </ScrollView>
  );
}

export default function ProductDetailsScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, error, isPending, refetch } = useProduct(id);

  if (isPending) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.background }}>
        <ProductDetailsSkeleton />
      </ScrollView>
    );
  }

  if (!product) {
    const missing = error instanceof ApiError && error.status === 404;
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <StateMessage
          title={missing ? 'This product is no longer available' : "We couldn't load this product"}
          message={missing ? undefined : error?.message}
          actionLabel={missing ? 'Back to shopping' : 'Try again'}
          onAction={missing ? () => router.replace('/') : () => refetch()}
        />
      </View>
    );
  }

  return <ProductDetails product={product} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 16,
    gap: 12,
  },
  wide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 16,
  },
  wideImage: {
    borderRadius: 20,
  },
  wideBody: {
    flex: 1,
    paddingTop: 0,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  stock: {
    fontSize: 15,
    fontWeight: '800',
  },
  options: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionsLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  heading: {
    marginTop: 8,
    fontSize: 17,
    fontWeight: '800',
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
  },
  report: {
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});
