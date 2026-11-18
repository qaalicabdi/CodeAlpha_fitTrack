import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

export type PickPhotoResult = { status: 'picked'; uri: string } | { status: 'cancelled' } | { status: 'denied' };

/**
 * Lets the user choose a profile photo and copies it into the app's document directory, so it
 * stays available after the picker's temporary cache is cleared. Nothing leaves the device.
 */
export async function pickProfilePhoto(previousUri: string | null): Promise<PickPhotoResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
  const asset = result.canceled ? undefined : result.assets[0];
  if (!asset) return { status: 'cancelled' };
  if (Platform.OS === 'web') return { status: 'picked', uri: asset.uri };

  const dir = new Directory(Paths.document, 'profile');
  if (!dir.exists) dir.create({ intermediates: true });
  const target = new File(dir, `avatar-${Date.now()}.jpg`);
  new File(asset.uri).copy(target);

  if (previousUri && previousUri.startsWith(dir.uri)) {
    try {
      const old = new File(previousUri);
      if (old.exists) old.delete();
    } catch {
      // An orphaned old photo is harmless.
    }
  }
  return { status: 'picked', uri: target.uri };
}
