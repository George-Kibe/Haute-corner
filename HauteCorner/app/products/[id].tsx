import { PagerView } from '@expo/ui/community/pager-view';
import { Host, Picker } from '@expo/ui';
import Star from '@expo/material-symbols/star.xml';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useDispatch } from 'react-redux';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { HeaderActions } from '@/components/header-actions';
import { StateMessage } from '@/components/state-message';
import { useAppConfig } from '@/features/config/use-app-config';
import { ProductImage } from '@/features/products/product-image';
import { useProduct } from '@/features/products/queries';
import { firstImage, type Product } from '@/features/products/types';
import { useColors } from '@/hooks/use-colors';
import { ApiError } from '@/lib/api-client';
import { formatPrice } from '@/lib/format';
import { imageUrl } from '@/lib/media';
import { cartSlice } from '@/store/cartSlice';

function ProductDetails({ product }: { product: Product }) {
  const colors = useColors();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { data: config } = useAppConfig();
  const [selectedOption, setSelectedOption] = useState(product.options[0]);
  const [liked, setLiked] = useState(false);

  const images = product.media.filter((item) => item.kind === 'image');
  const soldOut = product.stock === 0;
  // In landscape-shaped windows the image sits beside the details, so it never fills the screen.
  const wide = width > height;
  const imageSize = wide ? Math.min((width - insets.left - insets.right) / 2, height * 0.75) : width;

  const addToCart = () => {
    const image = firstImage(product);
    const cloudName = config?.cloudinaryCloudName;
    // The cart keeps its old shape until it is rebuilt in Phase 5.
    dispatch(
      cartSlice.actions.addCartItem({
        product: {
          _id: product.id,
          title: product.title,
          price: product.price,
          images: image && cloudName ? [imageUrl(cloudName, image.publicId, 400)] : [],
        },
      }),
    );
    Toast.show({ type: 'success', text1: 'Added to cart', text2: product.title });
  };

  const toggleLiked = () => {
    setLiked(!liked);
    Toast.show({
      type: liked ? 'info' : 'success',
      text1: liked ? 'Removed from likes' : 'Added to likes',
    });
  };

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.background }}>
      <HeaderActions showTrackOrder={false}>
        <Stack.Toolbar.Button
          accessibilityLabel={liked ? 'Remove from likes' : 'Add to likes'}
          icon={process.env.EXPO_OS === 'ios' ? (liked ? 'star.fill' : 'star') : Star}
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

          <AppText style={styles.heading}>About this product</AppText>
          <AppText style={[styles.description, { color: colors.muted }]}>{product.description}</AppText>
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
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator accessibilityLabel="Loading product" color={colors.primary} />
      </View>
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
});
