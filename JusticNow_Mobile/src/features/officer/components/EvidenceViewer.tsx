import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Linking, Modal, Pressable, StyleSheet, View } from 'react-native';

import { CaseEvidenceItem } from '@/api/officerApi';
import { Badge, Card, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDate } from '@/features/cases/statusUtils';

interface EvidenceViewerProps {
  evidence: CaseEvidenceItem[];
}

export function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  const colors = useColors();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!evidence || evidence.length === 0) {
    return (
      <Card style={[styles.emptyContainer, { backgroundColor: colors.surfaceMuted }]}>
        <Ionicons color={colors.textTertiary} name="document-attach-outline" size={32} />
        <Text color="textSecondary" style={styles.emptyText} variant="body">
          No evidence files attached to this report.
        </Text>
      </Card>
    );
  }

  const isImageFile = (fileType: string, url: string) => {
    return (
      fileType?.toLowerCase().includes('image') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    );
  };

  const handleOpenEvidence = (url: string, isImage: boolean) => {
    if (isImage) {
      setSelectedImage(url);
    } else {
      Linking.openURL(url).catch(() => {});
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {evidence.map((item, index) => {
          const isImg = isImageFile(item.fileType, item.fileUrl);

          return (
            <Card
              bordered
              key={item.id || index}
              onPress={() => handleOpenEvidence(item.fileUrl, isImg)}
              style={styles.evidenceCard}
            >
              {isImg ? (
                <View style={styles.imageThumbnailWrapper}>
                  <Image
                    resizeMode="cover"
                    source={{ uri: item.fileUrl }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons color="#ffffff" name="expand-outline" size={18} />
                  </View>
                </View>
              ) : (
                <View style={[styles.fileThumbnailWrapper, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons color={colors.primary} name="document-text-outline" size={36} />
                  <Badge
                    label={item.fileType ? item.fileType.split('/')[1]?.toUpperCase() || 'FILE' : 'FILE'}
                    tone="info"
                  />
                </View>
              )}

              <View style={styles.cardFooter}>
                <Text numberOfLines={1} style={[styles.fileName, { fontWeight: '700' }]} variant="caption">
                  {`Evidence #${item.id || index + 1}`}
                </Text>
                <Text color="textTertiary" variant="caption">
                  {formatCaseDate(item.createdAt)}
                </Text>
              </View>
            </Card>
          );
        })}
      </View>

      {/* Full-screen image modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
        transparent
        visible={!!selectedImage}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close preview"
            onPress={() => setSelectedImage(null)}
            style={styles.closeButton}
          >
            <Ionicons color="#ffffff" name="close" size={28} />
          </Pressable>
          {selectedImage && (
            <Image
              resizeMode="contain"
              source={{ uri: selectedImage }}
              style={styles.fullImage}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  evidenceCard: {
    minWidth: 140,
    flex: 1,
    maxWidth: '48%',
    padding: Spacing.sm,
  },
  imageThumbnailWrapper: {
    position: 'relative',
    height: 120,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: Radius.sm,
    padding: 4,
  },
  fileThumbnailWrapper: {
    height: 120,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  cardFooter: {
    marginTop: Spacing.sm,
    gap: 2,
  },
  fileName: {
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});
