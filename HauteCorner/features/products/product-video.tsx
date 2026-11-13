import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { useAppConfig } from '@/features/config/use-app-config';
import type { ProductMedia } from '@/features/products/types';
import { useColors } from '@/hooks/use-colors';
import { pickImageWidth, videoPosterUrl, videoStreamUrl } from '@/lib/media';

// A product video shows its first frame until tapped. Only then is a player
// created, so opening a product never spends the shopper's data on video.
export function ProductVideo({ video, layoutWidth }: { video: ProductMedia; layoutWidth: number }) {
  const colors = useColors();
  const { data: config } = useAppConfig();
  const [playing, setPlaying] = useState(false);
  const [firstFrame, setFirstFrame] = useState(false);
  if (!config) return null;

  const aspectRatio = video.width && video.height ? video.width / video.height : 9 / 16;
  // Tall phone videos are kept to a sensible height beside the product details.
  const width = Math.min(layoutWidth, aspectRatio < 1 ? layoutWidth * 0.75 : layoutWidth);
  const poster = videoPosterUrl(config.cloudinaryCloudName, video.publicId, pickImageWidth(width * 2));

  return (
    <View style={[styles.frame, { width, aspectRatio, backgroundColor: colors.surface }]}>
      {playing ? (
        <Player
          source={videoStreamUrl(config.cloudinaryCloudName, video.publicId)}
          onFirstFrame={() => setFirstFrame(true)}
        />
      ) : null}
      {firstFrame ? null : (
        <Pressable
          accessibilityLabel="Play the product video"
          accessibilityRole="button"
          disabled={playing}
          style={StyleSheet.absoluteFill}
          onPress={() => setPlaying(true)}>
          <Image contentFit="cover" source={poster} style={StyleSheet.absoluteFill} />
          <View style={styles.playBadge}>
            <AppText style={styles.playText}>{playing ? 'Loading…' : `▶ Play${video.durationSeconds ? ` · ${video.durationSeconds}s` : ''}`}</AppText>
          </View>
        </Pressable>
      )}
    </View>
  );
}

function Player({ source, onFirstFrame }: { source: string; onFirstFrame: () => void }) {
  const player = useVideoPlayer({ uri: source, contentType: 'hls' }, (instance) => {
    instance.loop = true;
    instance.play();
  });
  return (
    <VideoView
      contentFit="contain"
      nativeControls
      player={player}
      style={StyleSheet.absoluteFill}
      onFirstFrameRender={onFirstFrame}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    alignSelf: 'center',
    borderRadius: 16,
    overflow: 'hidden',
  },
  playBadge: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(11,18,32,0.7)',
  },
  playText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
