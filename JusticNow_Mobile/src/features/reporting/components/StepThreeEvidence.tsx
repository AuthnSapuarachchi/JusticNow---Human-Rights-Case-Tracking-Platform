import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, StyleSheet, Pressable, Image, Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { Button, Card, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

import { FooterSlot, StepFooter, StepLayout } from './StepLayout';

interface StepThreeProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepThreeEvidence({ data, updateData, onNext, onPrev }: StepThreeProps) {
  const colors = useColors();
  const files: any[] = data.files || [];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to attach evidence. You can change this in your device settings.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      let webFile = asset.file;
      let displayUri = asset.uri;

      // Web: keep a real File for upload and a stable object URL for the preview.
      if (Platform.OS === 'web') {
        if (!webFile) {
          try {
            const response = await fetch(asset.uri);
            if (!response.ok) throw new Error('The selected photo could not be read.');
            const blob = await response.blob();
            webFile = new File([blob], asset.fileName || `evidence_${Date.now()}.jpg`, {
              type: asset.mimeType || blob.type || 'application/octet-stream',
            });
          } catch (error) {
            console.error('Failed to fetch web blob:', error);
            Alert.alert('Photo unavailable', 'Please choose the photo again before continuing.');
            return;
          }
        }

        if (!(webFile instanceof Blob)) {
          Alert.alert('Photo unavailable', 'This photo could not be prepared for upload. Please choose it again.');
          return;
        }
        displayUri = URL.createObjectURL(webFile);
      }

      const newFile = {
        uri: displayUri,
        name: asset.fileName || `evidence_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        file: webFile,
      };

      updateData({ ...data, files: [...files, newFile] });
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = files.filter((_: any, index: number) => index !== indexToRemove);
    updateData({ ...data, files: updatedFiles });
  };

  return (
    <StepLayout
      footer={
        <StepFooter>
          <FooterSlot><Button fullWidth label="Back" onPress={onPrev} variant="secondary" /></FooterSlot>
          <FooterSlot grow={2}>
            <Button fullWidth icon="arrow-forward" label={files.length ? 'Continue' : 'Skip for now'} onPress={onNext} />
          </FooterSlot>
        </StepFooter>
      }
      subtitle="Photos or screenshots can help, but they are optional. Only the people handling your case can see them."
      title="Add evidence"
    >
      <Pressable
        accessibilityHint="Opens your photo library"
        accessibilityLabel="Add a photo"
        accessibilityRole="button"
        onPress={pickImage}
        style={({ pressed }) => [
          styles.dropzone,
          { backgroundColor: colors.surface, borderColor: colors.borderStrong },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.dropIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons color={colors.primary} name="image-outline" size={26} />
        </View>
        <Text variant="bodyStrong">Add a photo</Text>
        <Text color="textSecondary" variant="caption">JPG or PNG, up to 10 MB</Text>
      </Pressable>

      {files.length > 0 ? (
        <View style={styles.fileList}>
          {files.map((file: any, index: number) => (
            <Card key={`${file.uri}-${index}`} style={styles.fileCard}>
              <Image source={{ uri: file.uri }} style={[styles.preview, { backgroundColor: colors.surfaceMuted }]} />
              <Text ellipsizeMode="middle" numberOfLines={1} style={styles.fileName}>
                {file.name}
              </Text>
              <Pressable
                accessibilityLabel={`Remove ${file.name}`}
                accessibilityRole="button"
                hitSlop={6}
                onPress={() => removeFile(index)}
                style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
              >
                <Ionicons color={colors.danger} name="trash-outline" size={22} />
              </Pressable>
            </Card>
          ))}
        </View>
      ) : null}

      <View style={[styles.note, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
        <Text color="textSecondary" style={styles.flex} variant="caption">
          The first photo is uploaded with your report. You can share more later in your case messages.
        </Text>
      </View>
    </StepLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.7 },
  dropzone: { alignItems: 'center', borderRadius: Radius.lg, borderStyle: 'dashed', borderWidth: 1.5, gap: Spacing.xs, paddingVertical: Spacing.xxl },
  dropIcon: { alignItems: 'center', borderRadius: Radius.md, height: 52, justifyContent: 'center', marginBottom: Spacing.sm, width: 52 },
  fileList: { gap: Spacing.md },
  fileCard: { alignItems: 'center', flexDirection: 'row', gap: Spacing.md, padding: Spacing.sm },
  preview: { borderRadius: Radius.sm, height: 56, width: 56 },
  fileName: { flex: 1 },
  removeButton: { alignItems: 'center', height: Layout.minTapTarget, justifyContent: 'center', width: Layout.minTapTarget },
  note: { alignItems: 'flex-start', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
});
