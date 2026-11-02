import { Image } from 'expo-image';
import { PixelRatio, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';

import { useAppConfig } from '@/features/config/use-app-config';
import { useColors } from '@/hooks/use-colors';
import { imageUrl, pickImageWidth, previewImageUrl } from '@/lib/media';

type ProductImageProps = {
  publicId?: string;
  layoutWidth: number;
  style?: StyleProp<ViewStyle & ImageStyle>;
  accessibilityLabel?: string;
};

export function ProductImage({ publicId, layoutWidth, style, accessibilityLabel }: ProductImageProps) {
  const colors = useColors();
  const { data: config } = useAppConfig();
  const cloudName = config?.cloudinaryCloudName;

  if (!cloudName || !publicId) {
    return <View style={[{ backgroundColor: colors.tint }, style]} />;
  }

  const width = pickImageWidth(PixelRatio.getPixelSizeForLayoutSize(layoutWidth));

  return (
    <Image
      accessibilityLabel={accessibilityLabel}
      contentFit="cover"
      placeholder={{ uri: previewImageUrl(cloudName, publicId) }}
      placeholderContentFit="cover"
      recyclingKey={publicId}
      source={{ uri: imageUrl(cloudName, publicId, width) }}
      style={[{ backgroundColor: colors.tint }, style]}
      transition={200}
    />
  );
}
