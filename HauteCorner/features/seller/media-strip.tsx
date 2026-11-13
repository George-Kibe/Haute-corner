import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useAppConfig } from '@/features/config/use-app-config';
import { useColors } from '@/hooks/use-colors';
import { imageUrl, videoPosterUrl } from '@/lib/media';

// One photo or video in a form. A file picked on this phone shows its local
// copy while it uploads, and has a publicId once it is in Cloudinary.
export type MediaItem = {
  key: string;
  kind: 'image' | 'video';
  localUri?: string;
  publicId?: string;
  progress?: number;
  error?: string;
};

const SIZE = 96;

// A row of thumbnails with upload progress and a remove button. There is no
// native thumbnail strip with per-file progress, so this is a small custom view
// hosted inside the native form.
export function MediaStrip({ items, onRemove }: { items: MediaItem[]; onRemove: (key: string) => void }) {
  const colors = useColors();
  const { data: config } = useAppConfig();
  const cloud = config?.cloudinaryCloudName;

  if (items.length === 0) return null;

  return (
    <ScrollView contentContainerStyle={styles.row} horizontal showsHorizontalScrollIndicator={false}>
      {items.map((item, index) => {
        const source =
          item.localUri ??
          (cloud && item.publicId
            ? item.kind === 'image'
              ? imageUrl(cloud, item.publicId, 200)
              : videoPosterUrl(cloud, item.publicId, 200)
            : undefined);
        const uploading = item.progress !== undefined && item.progress < 1 && !item.error;
        return (
          <View key={item.key} style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {source ? <Image contentFit="cover" source={source} style={styles.image} /> : null}
            {item.kind === 'video' ? (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>Video</AppText>
              </View>
            ) : index === 0 ? (
              <View style={styles.badge}>
                <AppText style={styles.badgeText}>Cover</AppText>
              </View>
            ) : null}
            {uploading ? (
              <View style={styles.overlay}>
                <AppText style={styles.overlayText}>{Math.round((item.progress ?? 0) * 100)}%</AppText>
              </View>
            ) : null}
            {item.error ? (
              <View style={[styles.overlay, { backgroundColor: 'rgba(179,38,30,0.75)' }]}>
                <AppText style={styles.overlayText}>Failed</AppText>
              </View>
            ) : null}
            <Pressable
              accessibilityLabel={item.kind === 'video' ? 'Remove video' : 'Remove photo'}
              accessibilityRole="button"
              hitSlop={8}
              style={styles.remove}
              onPress={() => onRemove(item.key)}>
              <AppText style={styles.removeText}>×</AppText>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 8,
  },
  tile: {
    width: SIZE,
    height: SIZE,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  image: {
    width: SIZE,
    height: SIZE,
  },
  badge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(11,18,32,0.7)',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,18,32,0.55)',
  },
  overlayText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,18,32,0.7)',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '800',
  },
});
