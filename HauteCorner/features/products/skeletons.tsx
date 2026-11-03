import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Skeleton } from '@/components/skeleton';

// Matches ProductCard: a square image, two lines of title, price and seller.
export function ProductCardSkeleton({ width }: { width: number }) {
  return (
    <View style={[styles.card, { width }]}>
      <Skeleton style={styles.image} />
      <Skeleton style={[styles.line, { width: '85%', marginTop: 10 }]} />
      <Skeleton style={[styles.line, { width: '40%' }]} />
      <Skeleton style={[styles.line, { width: '55%', height: 10 }]} />
    </View>
  );
}

// Enough cards to fill a screen at the current number of columns.
export function ProductGridSkeleton({ columns, cardWidth }: { columns: number; cardWidth: number }) {
  const { height } = useWindowDimensions();
  const rows = Math.max(2, Math.ceil(height / (cardWidth + 90)));

  return (
    <View accessible accessibilityLabel="Loading products" accessibilityRole="progressbar" style={styles.grid}>
      {Array.from({ length: rows * columns }, (_, index) => (
        <ProductCardSkeleton key={index} width={cardWidth} />
      ))}
    </View>
  );
}

// Matches the product page, beside or below the image as the window allows.
export function ProductDetailsSkeleton() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const wide = width > height;
  const imageSize = wide ? Math.min((width - insets.left - insets.right) / 2, height * 0.75) : width;

  return (
    <View
      accessible
      accessibilityLabel="Loading product"
      accessibilityRole="progressbar"
      style={wide ? [styles.wide, { paddingLeft: insets.left + 16, paddingRight: insets.right + 16 }] : undefined}>
      <Skeleton style={{ width: imageSize, height: imageSize, borderRadius: wide ? 20 : 0 }} />
      <View style={[styles.body, wide && styles.wideBody]}>
        <Skeleton style={[styles.line, { width: '75%', height: 24 }]} />
        <Skeleton style={[styles.line, { width: '30%', height: 20 }]} />
        <Skeleton style={[styles.line, { width: '60%' }]} />
        <Skeleton style={styles.block} />
        <Skeleton style={[styles.block, { borderRadius: 24 }]} />
        <Skeleton style={[styles.line, { width: '45%', height: 18, marginTop: 8 }]} />
        <Skeleton style={styles.line} />
        <Skeleton style={styles.line} />
        <Skeleton style={[styles.line, { width: '70%' }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    padding: 8,
    gap: 6,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  line: {
    height: 14,
    width: '100%',
    borderRadius: 7,
  },
  wide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 16,
  },
  body: {
    padding: 16,
    gap: 12,
  },
  wideBody: {
    flex: 1,
    paddingTop: 0,
  },
  block: {
    height: 50,
    width: '100%',
    borderRadius: 16,
  },
});
