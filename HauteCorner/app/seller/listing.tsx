import CheckIcon from '@expo/material-symbols/check.xml';
import CloseIcon from '@expo/material-symbols/close.xml';
import { FieldGroup, Picker, RNHostView, Text, TextInput } from '@expo/ui';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Keyboard } from 'react-native';
import Toast from 'react-native-toast-message';

import { FormButton } from '@/components/form-button';
import { FormHost } from '@/components/form-host';
import { ErrorText, toFormErrors, type FormErrors } from '@/features/auth/auth-form';
import { ProfileSkeleton } from '@/features/auth/profile-skeleton';
import { useAppConfig } from '@/features/config/use-app-config';
import type { Audience, ProductType } from '@/features/products/types';
import { MediaStrip } from '@/features/seller/media-strip';
import { pickPhotos, pickVideo } from '@/features/seller/pick-media';
import { useArchiveListing, useOwnProduct, useSaveListing } from '@/features/seller/queries';
import type { OwnProduct } from '@/features/seller/types';
import { useMediaUploads } from '@/features/seller/use-media-uploads';
import { useColors } from '@/hooks/use-colors';

const isIOS = process.env.EXPO_OS === 'ios';

const TYPES: { value: ProductType; label: string }[] = [
  { value: 'shoes', label: 'Shoes' },
  { value: 'clothing', label: 'Clothing' },
];
const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'children', label: 'Children' },
  { value: 'unisex', label: 'Unisex' },
];

const STATUS_NOTES: Record<OwnProduct['status'], string> = {
  active: 'On sale.',
  archived: 'Archived. Shoppers cannot see it.',
  hidden: 'Hidden while your shop is not approved.',
  removed: 'Removed by HauteCorner.',
};

const wholeNumber = (value: string) => {
  const number = Number(value.replace(/[,\s]/g, ''));
  return value.trim() !== '' && Number.isInteger(number) ? number : null;
};

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: product } = useOwnProduct(id);
  if (id && !product) return <ProfileSkeleton />;
  return <ListingForm product={product} />;
}

function ListingForm({ product }: { product?: OwnProduct }) {
  const colors = useColors();
  const { data: config } = useAppConfig();
  const save = useSaveListing();
  const archive = useArchiveListing();
  const [errors, setErrors] = useState<FormErrors>({ fields: {} });
  const [type, setType] = useState<ProductType>(product?.type ?? 'clothing');
  const [audience, setAudience] = useState<Audience>(product?.audience ?? 'women');
  const media = useMediaUploads(
    product?.media.map((item) => ({ key: item.publicId, kind: item.kind, publicId: item.publicId, progress: 1 })) ?? [],
  );
  const initial = {
    title: product?.title ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '1',
    options: product?.options.join(', ') ?? '',
  };
  const form = useRef(initial);
  const removed = product?.status === 'removed';
  const maxImages = config?.maxImagesPerProduct ?? 10;
  const images = media.items.filter((item) => item.kind === 'image').length;
  const hasVideo = media.items.some((item) => item.kind === 'video');
  const muted = (text: string) => <Text textStyle={{ color: colors.muted }}>{text}</Text>;

  async function submit() {
    Keyboard.dismiss();
    if (media.uploading) {
      Toast.show({ type: 'info', text1: 'Your photos are still uploading' });
      return;
    }
    if (media.failed) {
      Toast.show({ type: 'error', text1: 'Remove the uploads that failed, then try again' });
      return;
    }
    const price = wholeNumber(form.current.price);
    const stock = wholeNumber(form.current.stock);
    const fields: Record<string, string> = {};
    if (price === null) fields.price = 'Enter the price in whole shillings, such as 2500';
    if (stock === null) fields.stock = 'Enter how many you have, such as 3';
    if (Object.keys(fields).length) {
      setErrors({ fields });
      return;
    }
    setErrors({ fields: {} });
    try {
      await save.mutateAsync({
        id: product?.id,
        fields: {
          title: form.current.title,
          description: form.current.description,
          type,
          audience,
          price: price!,
          stock: stock!,
          options: form.current.options
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean),
          media: media.uploaded,
        },
      });
      router.back();
      Toast.show({ type: 'success', text1: product ? 'Listing saved' : 'Your listing is on sale' });
    } catch (error) {
      setErrors(toFormErrors(error));
    }
  }

  function confirmArchive() {
    if (!product) return;
    Alert.alert('Archive this listing?', 'Shoppers will no longer see it. You can put it back on sale later.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          try {
            await archive.mutateAsync(product.id);
            router.back();
            Toast.show({ type: 'success', text1: 'Listing archived' });
          } catch (error) {
            Toast.show({ type: 'error', text1: 'Could not archive it', text2: (error as Error).message });
          }
        },
      },
    ]);
  }

  async function restore() {
    if (!product) return;
    try {
      await save.mutateAsync({ id: product.id, fields: { status: 'active' } });
      router.back();
      Toast.show({ type: 'success', text1: 'Back on sale' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Could not put it back on sale', text2: (error as Error).message });
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: product ? 'Edit Listing' : 'New Listing' }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button accessibilityLabel="Cancel" icon={isIOS ? undefined : CloseIcon} onPress={() => router.back()}>
          <Stack.Toolbar.Label>Cancel</Stack.Toolbar.Label>
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      {removed ? null : (
        <Stack.Toolbar placement="right">
          <Stack.Toolbar.Button
            accessibilityLabel="Save"
            disabled={save.isPending}
            icon={isIOS ? undefined : CheckIcon}
            variant="done"
            onPress={submit}>
            <Stack.Toolbar.Label>Save</Stack.Toolbar.Label>
          </Stack.Toolbar.Button>
        </Stack.Toolbar>
      )}
      <FormHost>
        <FieldGroup>
          {product ? (
            <FieldGroup.Section title="Status">
              <Text>{STATUS_NOTES[product.status]}</Text>
              {product.removedReason ? <Text textStyle={{ color: colors.danger }}>{product.removedReason}</Text> : null}
              {product.status === 'active' ? <FormButton label="Archive listing" variant="link" onPress={confirmArchive} /> : null}
              {product.status === 'archived' ? <FormButton label="Put back on sale" variant="link" onPress={restore} /> : null}
            </FieldGroup.Section>
          ) : null}

          <FieldGroup.Section title="Photos and video">
            {media.items.length ? (
              <RNHostView matchContents={{ vertical: true }}>
                <MediaStrip items={media.items} onRemove={media.remove} />
              </RNHostView>
            ) : null}
            <FormButton
              disabled={removed}
              label={images ? 'Add more photos' : 'Add photos'}
              variant="link"
              onPress={async () => media.add('image', await pickPhotos(maxImages - images, config))}
            />
            {hasVideo ? null : (
              <FormButton
                disabled={removed}
                label="Add a video"
                variant="link"
                onPress={async () => {
                  const video = await pickVideo(config);
                  if (video) media.add('video', [video]);
                }}
              />
            )}
            <FieldGroup.SectionFooter>
              {errors.fields.media ? (
                <ErrorText>{errors.fields.media}</ErrorText>
              ) : (
                muted(
                  `Up to ${maxImages} photos; the first is the cover. One video from your library, up to ${config?.maxVideoSeconds ?? 30} seconds.`,
                )
              )}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Details">
            <TextInput
              accessibilityLabel="Title"
              autoCapitalize="sentences"
              defaultValue={initial.title}
              placeholder="Title, such as Leather ankle boots"
              onChangeText={(value) => (form.current.title = value)}
            />
            <TextInput
              accessibilityLabel="Description"
              defaultValue={initial.description}
              multiline
              placeholder="Material, fit, condition and anything a buyer should know"
              onChangeText={(value) => (form.current.description = value)}
            />
            <FieldGroup.SectionFooter>
              <ErrorText>{errors.fields.title ?? errors.fields.description}</ErrorText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Category">
            <Picker<ProductType> selectedValue={type} onValueChange={setType} testID="type-picker">
              {TYPES.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </FieldGroup.Section>

          <FieldGroup.Section title="Who it is for">
            <Picker<Audience> selectedValue={audience} onValueChange={setAudience} testID="audience-picker">
              {AUDIENCES.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </FieldGroup.Section>

          <FieldGroup.Section title="Price and stock">
            <TextInput
              accessibilityLabel="Price in shillings"
              defaultValue={initial.price}
              keyboardType="number-pad"
              placeholder="Price in KES"
              onChangeText={(value) => (form.current.price = value)}
            />
            <TextInput
              accessibilityLabel="Number in stock"
              defaultValue={initial.stock}
              keyboardType="number-pad"
              placeholder="Number in stock"
              onChangeText={(value) => (form.current.stock = value)}
            />
            <FieldGroup.SectionFooter>
              <ErrorText>{errors.fields.price ?? errors.fields.stock}</ErrorText>
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          <FieldGroup.Section title="Sizes">
            <TextInput
              accessibilityLabel="Sizes"
              autoCapitalize="characters"
              defaultValue={initial.options}
              placeholder="Separate with commas, such as 38, 39, 40"
              onChangeText={(value) => (form.current.options = value)}
            />
            <FieldGroup.SectionFooter>
              {errors.fields.options ? (
                <ErrorText>{errors.fields.options}</ErrorText>
              ) : (
                muted('Leave empty for one-size items.')
              )}
            </FieldGroup.SectionFooter>
          </FieldGroup.Section>

          {errors.message ? (
            <FieldGroup.Section>
              <ErrorText>{errors.message}</ErrorText>
            </FieldGroup.Section>
          ) : null}
        </FieldGroup>
      </FormHost>
    </>
  );
}
