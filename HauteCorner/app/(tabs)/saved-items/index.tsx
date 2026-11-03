import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Button } from '@/components/button';
import { useSession } from '@/features/auth/session';
import { openSignIn } from '@/features/auth/sign-in-required';
import { ProductGridView } from '@/features/products/product-grid';
import { useProductsByIds } from '@/features/products/queries';
import { useWishlist } from '@/features/wishlist/store';
import { refreshFromAccount } from '@/features/wishlist/sync';
import { useColors } from '@/hooks/use-colors';

// Likes work without an account. Signed out, a note offers to keep them on every device.
function SyncNote() {
  const colors = useColors();
  return (
    <View style={[styles.note, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText style={styles.noteTitle}>Your likes are saved on this phone</AppText>
      <AppText style={[styles.noteText, { color: colors.muted }]}>
        Sign in to keep them in your account and see them on any device.
      </AppText>
      <Button label="Sign in" onPress={openSignIn} />
    </View>
  );
}

export default function WishListScreen() {
  const productIds = useWishlist((state) => state.productIds);
  const signedIn = useSession((state) => state.status === 'signedIn');
  const { data, error, isPending, isRefetching, refetch } = useProductsByIds(productIds);

  // Newest like first. Products no longer for sale are left out.
  const products = useMemo(() => {
    const byId = new Map((data ?? []).map((product) => [product.id, product]));
    return productIds.flatMap((id) => byId.get(id) ?? []);
  }, [data, productIds]);

  const refresh = async () => {
    if (signedIn) await refreshFromAccount().catch(() => undefined);
    await refetch();
  };

  return (
    <ProductGridView
      emptyMessage="Tap the star on any product to save it here."
      emptyTitle="Nothing saved yet"
      error={productIds.length > 0 ? error : null}
      header={!signedIn && productIds.length > 0 ? <SyncNote /> : null}
      isPending={productIds.length > 0 && isPending}
      onRefresh={refresh}
      onRetry={() => refetch()}
      products={products}
      refreshing={isRefetching}
    />
  );
}

const styles = StyleSheet.create({
  note: {
    margin: 8,
    padding: 16,
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
});
