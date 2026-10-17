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
