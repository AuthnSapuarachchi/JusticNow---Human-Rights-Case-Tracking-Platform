import { File } from 'expo-file-system';

/**
 * A native file as a FormData part. Expo's fetch rejects React Native's
 * `{ uri, name, type }` parts ("Unsupported FormDataPart implementation"); it
 * reads `name`, `type` and `bytes()` from the appended object instead.
 * Native only — web already appends a real Blob.
 */
export function nativeFormDataFile(uri: string, name: string, type: string): Blob {
  const file = new File(uri);
  return { name, type, bytes: () => file.bytes() } as unknown as Blob;
}

/**
 * iOS converts HEIC photos to JPEG for us (see `preferredAssetRepresentationMode`),
 * but can keep the original `IMG_1234.HEIC` name. Match the name to the real type.
 */
export function jpegSafeName(name: string, mimeType?: string | null): string {
  return mimeType === 'image/jpeg' ? name.replace(/\.(heic|heif)$/i, '.jpg') : name;
}
