import AddIcon from '@expo/material-symbols/add.xml';
import StoreIcon from '@expo/material-symbols/storefront.xml';
import { FieldGroup, Host, ListItem, Text } from '@expo/ui';
import { Image } from 'expo-image';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { StateMessage } from '@/components/state-message';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { SignInRequired } from '@/features/auth/sign-in-required';
import { useAppConfig } from '@/features/config/use-app-config';
import { firstImage } from '@/features/products/types';
import { useOwnProducts, useOwnSeller } from '@/features/seller/queries';
import type { OwnProduct, OwnSeller } from '@/features/seller/types';
import { useColors } from '@/hooks/use-colors';
import { formatPrice } from '@/lib/format';
import { imageUrl } from '@/lib/media';

const isIOS = process.env.EXPO_OS === 'ios';

const STATUS_LABELS: Record<OwnProduct['status'], string> = {
  active: 'On sale',
  archived: 'Archived',
  hidden: 'Hidden',
  removed: 'Removed by HauteCorner',
};

export default function SellScreen() {
  return (
    <SignInRequired
      title="Sell on HauteCorner"
      message="Sign in to apply for a shop, then list your shoes and clothing with photos and a short video.">
      <Sell />
    </SignInRequired>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  return <View style={[styles.centered, { backgroundColor: colors.background }]}>{children}</View>;
}

function Sell() {
  const { data: seller, error, isPending, refetch } = useOwnSeller();

  // Approval happens on the web, so check again whenever the tab is opened.
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isPending) return <ProfileSkeleton />;
  if (error) {
    return (
      <Centered>
        <StateMessage title="Could not load your shop" message={error.message} actionLabel="Try again" onAction={() => refetch()} />
      </Centered>
    );
  }

  const apply = () => router.push('/seller/apply');
  if (!seller) {
    return (
      <Centered>
        <StateMessage
          title="Sell on HauteCorner"
          message="Apply with your business and M-Pesa details and a photo of your ID. Our team reviews each application before you can list."
          actionLabel="Apply to sell"
          onAction={apply}
        />
      </Centered>
    );
  }
  switch (seller.status) {
    case 'applied':
      return (
        <Centered>
          <StateMessage
            title="Your application is being reviewed"
            message={`We will email you once ${seller.businessName} is approved. You can list products straight after.`}
          />
        </Centered>
      );
    case 'rejected':
      return (
        <Centered>
          <StateMessage
            title="We could not approve your shop yet"
            message={seller.reviewReason ? `Reason: ${seller.reviewReason}` : undefined}
            actionLabel="Apply again"
            onAction={apply}
          />
        </Centered>
      );
    case 'suspended':
      return (
        <Centered>
          <StateMessage
            title="Your shop is suspended"
            message={`Your listings are hidden.${seller.reviewReason ? ` Reason: ${seller.reviewReason}.` : ''} Email us if you think this is a mistake.`}
          />
        </Centered>
      );
    default:
      return <Listings seller={seller} />;
  }
}

function Listings({ seller }: { seller: OwnSeller }) {
  const colors = useColors();
  const { data: config } = useAppConfig();
  const { data: products, error, isPending, refetch } = useOwnProducts(true);
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const newListing = () => router.push('/seller/listing');

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          accessibilityLabel="Shop settings"
          icon={isIOS ? 'storefront' : StoreIcon}
          onPress={() => router.push('/seller/shop')}
        />
        <Stack.Toolbar.Button accessibilityLabel="New listing" icon={isIOS ? 'plus' : AddIcon} onPress={newListing} />
      </Stack.Toolbar>
      {isPending ? (
        <ProfileSkeleton />
      ) : error ? (
        <Centered>
          <StateMessage title="Could not load your listings" message={error.message} actionLabel="Try again" onAction={() => refetch()} />
        </Centered>
      ) : products.length === 0 ? (
        <Centered>
          <StateMessage
            title={`${seller.businessName} is ready`}
            message="Add your first listing with photos, sizes and a short video."
            actionLabel="New listing"
            onAction={newListing}
          />
        </Centered>
      ) : (
        <Host style={styles.fill}>
          <FieldGroup>
            {seller.payoutNumberUnderReview ? (
              <FieldGroup.Section>
                {muted('Payouts are paused while we confirm your new M-Pesa number.')}
              </FieldGroup.Section>
            ) : null}
            <FieldGroup.Section title={`${seller.businessName} · ${products.length} ${products.length === 1 ? 'listing' : 'listings'}`}>
              {products.map((product) => {
                const image = firstImage(product);
                return (
                  <ListItem
                    key={product.id}
                    leading={
                      image && config ? (
                        <Image
                          contentFit="cover"
                          source={imageUrl(config.cloudinaryCloudName, image.publicId, 200)}
                          style={styles.thumbnail}
                        />
                      ) : undefined
                    }
                    supportingText={muted(
                      `${formatPrice(product.price)} · ${product.stock} in stock · ${STATUS_LABELS[product.status]}`,
                    )}
                    testID={`listing-${product.id}`}
                    onPress={() => router.push({ pathname: '/seller/listing', params: { id: product.id } })}>
                    {product.title}
                  </ListItem>
                );
              })}
            </FieldGroup.Section>
          </FieldGroup>
        </Host>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
});
