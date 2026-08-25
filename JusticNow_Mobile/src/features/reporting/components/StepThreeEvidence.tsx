import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

interface StepThreeProps {
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function StepThreeEvidence({ data, updateData, onNext, onPrev }: StepThreeProps) {
  
  const pickImage = async () => {
    // Request permission (Crucial for mobile UX and security!)
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'We need access to your photos to upload evidence.');
      return;
    }

    // Open the native image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8, // Slightly compress to keep payload light
    });

    if (!result.canceled) {
      const newFile = {
        uri: result.assets[0].uri,
        name: result.assets[0].fileName || `evidence_${Date.now()}.jpg`,
        type: 'image/jpeg'
      };
      
      // Add the new file to the existing array in our master state
      updateData({ ...data, files: [...(data.files || []), newFile] });
    }
  };

  const removeFile = (indexToRemove: number) => {
    const updatedFiles = data.files.filter((_: any, index: number) => index !== indexToRemove);
    updateData({ ...data, files: updatedFiles });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Attach Evidence</Text>
        <Text style={styles.subtitle}>Upload any photos or screenshots that support your report. This is strictly confidential.</Text>

        {/* Upload Button */}
        <TouchableOpacity style={styles.uploadBox} onPress={pickImage} activeOpacity={0.7}>
          <Text style={styles.uploadIcon}>📸</Text>
          <Text style={styles.uploadText}>Tap to select a photo</Text>
          <Text style={styles.uploadSubText}>JPG, PNG up to 10MB</Text>
        </TouchableOpacity>

        {/* File Preview Area */}
        <View style={styles.fileList}>
          {data.files && data.files.map((file: any, index: number) => (
            <View key={index} style={styles.fileCard}>
              <Image source={{ uri: file.uri }} style={styles.previewImage} />
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1} ellipsizeMode="middle">
                  {file.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFile(index)} style={styles.deleteButton}>
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.prevButton} onPress={onPrev}>
          <Text style={styles.prevButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next: Review →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748B', marginBottom: 20 },
  
  uploadBox: {
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginBottom: 20
  },
  uploadIcon: { fontSize: 32, marginBottom: 8 },
  uploadText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  uploadSubText: { fontSize: 12, color: '#94A3B8', marginTop: 4 },

  fileList: { gap: 12 },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8
  },
  previewImage: { width: 50, height: 50, borderRadius: 6, marginRight: 12, backgroundColor: '#E2E8F0' },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
  deleteButton: { padding: 8 },
  deleteButtonText: { fontSize: 18 },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  prevButton: { padding: 16, borderRadius: 8, backgroundColor: '#F1F5F9', flex: 1, marginRight: 8, alignItems: 'center' },
  prevButtonText: { color: '#475569', fontSize: 16, fontWeight: '600' },
  nextButton: { padding: 16, borderRadius: 8, backgroundColor: '#2563EB', flex: 2, alignItems: 'center' },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});