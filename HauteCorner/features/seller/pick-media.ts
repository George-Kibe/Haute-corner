import * as ImagePicker from 'expo-image-picker';
import { Alert, Keyboard } from 'react-native';

import type { AppConfig } from '@/features/config/use-app-config';

export type PickedFile = ImagePicker.ImagePickerAsset;

const MB = 1000 * 1000;

function choose<T>(title: string, options: { label: string; value: T }[]): Promise<T | null> {
  return new Promise((resolve) => {
    Alert.alert(title, undefined, [
      ...options.map((option) => ({ text: option.label, onPress: () => resolve(option.value) })),
      { text: 'Cancel', style: 'cancel' as const, onPress: () => resolve(null) },
    ]);
  });
}

// Photos come from the camera or the library, up to the remaining number.
// Files over the size limit are left out, with a note.
export async function pickPhotos(remaining: number, config: AppConfig | undefined): Promise<PickedFile[]> {
  // The form changes when files come back, which can crash UIKit if a field still has focus.
  Keyboard.dismiss();
  if (remaining <= 0) {
    Alert.alert('That is the most photos for one listing', 'Remove one to add another.');
    return [];
  }
  const source = await choose('Add photos', [
    { label: 'Take a photo', value: 'camera' as const },
    { label: 'Choose from library', value: 'library' as const },
  ]);
  if (!source) return [];

  let result: ImagePicker.ImagePickerResult;
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access is off', 'Allow camera access for HauteCorner in Settings to take photos.');
      return [];
    }
    result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 });
  } else {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      orderedSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
  }
  if (result.canceled) return [];

  const maxBytes = config?.maxImageBytes ?? 20 * MB;
  const fitting = result.assets.filter((asset) => !asset.fileSize || asset.fileSize <= maxBytes);
  if (fitting.length < result.assets.length) {
    Alert.alert('Some photos were too large', `Each photo must be under ${Math.round(maxBytes / MB)} MB.`);
  }
  return fitting.slice(0, remaining);
}

// One short video from the library. Sellers record with their camera app, as
// the microphone permission is off by decision.
export async function pickVideo(config: AppConfig | undefined): Promise<PickedFile | null> {
  Keyboard.dismiss();
  const maxSeconds = config?.maxVideoSeconds ?? 30;
  const maxBytes = config?.maxVideoBytes ?? 100 * MB;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsMultipleSelection: false,
    // Converts HEVC to H.264 on iOS, which every phone can play.
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (result.canceled) return null;
  const video = result.assets[0];

  // The picker reports milliseconds.
  if (video.duration && video.duration > (maxSeconds + 0.5) * 1000) {
    Alert.alert(`Videos can be up to ${maxSeconds} seconds`, 'Trim it in your Photos or Gallery app, then add it again.');
    return null;
  }
  if (video.fileSize && video.fileSize > maxBytes) {
    Alert.alert(`Videos must be under ${Math.round(maxBytes / MB)} MB`, 'Record at a lower resolution, or trim it, then add it again.');
    return null;
  }
  return video;
}
