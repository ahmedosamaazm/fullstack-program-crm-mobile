import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { ALLOWED_MIME_TYPES } from './api';
import type { PickedFile } from './types';

/**
 * SDK 54+ takes an ARRAY OF STRINGS, not the deprecated `MediaTypeOptions`
 * enum. Verified against https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/
 * — do not substitute a recalled `ImagePicker.MediaTypeOptions.Images`.
 */
const IMAGE_MEDIA_TYPES: ImagePicker.MediaType[] = ['images'];

/**
 * NFR-07 (`docs/phase1_brd_1.md:279`) — "images compressed client-side before
 * upload". This is that compression: the picker re-encodes at 70% JPEG quality
 * before handing back a URI, which takes a 12-megapixel phone photo from ~4 MB
 * to well under 1 MB. See `api.ts`'s upload doc comment for why
 * `expo-image-manipulator` is not used instead (story 24 open question 3).
 */
const IMAGE_QUALITY = 0.7;

function toPickedFile(asset: ImagePicker.ImagePickerAsset): PickedFile {
  return {
    uri: asset.uri,
    // `fileName` is null for a freshly captured photo on both platforms.
    fileName: asset.fileName ?? `photo-${Date.now()}.jpg`,
    // `mimeType` is documented as present, but a camera asset on Android has
    // been observed without one; the bucket allowlist has no room for a guess,
    // so fall back to the type the quality setting above actually produces.
    mimeType: asset.mimeType ?? 'image/jpeg',
    sizeBytes: asset.fileSize ?? 0,
  };
}

export async function pickFromCamera(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: IMAGE_MEDIA_TYPES,
    quality: IMAGE_QUALITY,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return toPickedFile(result.assets[0]);
}

export async function pickFromGallery(): Promise<PickedFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: IMAGE_MEDIA_TYPES,
    quality: IMAGE_QUALITY,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return toPickedFile(result.assets[0]);
}

/**
 * `type` is the bucket's allowlist, so the OS file browser greys out everything
 * the server would refuse. `copyToCacheDirectory` defaults to true and is left
 * so ON PURPOSE — without it, a content:// URI on Android is not readable by
 * `expo-file-system`, and the upload fails at the read rather than at the pick.
 */
export async function pickDocument(): Promise<PickedFile | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [...ALLOWED_MIME_TYPES],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    fileName: asset.name,
    mimeType: asset.mimeType ?? 'application/octet-stream',
    sizeBytes: asset.size ?? 0,
  };
}
