import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Alert, StyleSheet, TextInput, View } from 'react-native';

import { addCaseNote, CaseNote } from '@/api/officerApi';
import { Badge, Button, Card, Text } from '@/design-system/components';
import { Radius, Spacing } from '@/design-system/spacing';
import { useColors } from '@/design-system/use-colors';
import { formatCaseDateTime } from '@/features/cases/statusUtils';

interface CaseNotesPanelProps {
  caseId: number;
  initialNotes: CaseNote[];
  onNoteAdded?: (newNote: CaseNote) => void;
}

export function CaseNotesPanel({ caseId, initialNotes, onNoteAdded }: CaseNotesPanelProps) {
  const colors = useColors();
  const [notes, setNotes] = useState<CaseNote[]>(initialNotes || []);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newContent.trim() || newContent.trim().length < 2) {
      Alert.alert('Validation Error', 'Note content must be at least 2 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const createdNote = await addCaseNote(caseId, newContent.trim());
      setNotes((prev) => [createdNote, ...prev]);
      setNewContent('');
      onNoteAdded?.(createdNote);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to save note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Add note card */}
      <Card bordered style={styles.inputCard}>
        <View style={styles.inputHeader}>
          <Ionicons color={colors.primary} name="lock-closed" size={16} />
          <Text color="primary" style={{ fontWeight: '700' }} variant="caption">
            OFFICER-ONLY PRIVATE NOTE
          </Text>
        </View>

        <TextInput
          multiline
          numberOfLines={3}
          onChangeText={setNewContent}
          placeholder="Add confidential observations, investigative findings, or internal follow-ups..."
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.textArea,
            {
              backgroundColor: colors.surfaceMuted,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          value={newContent}
        />

        <View style={styles.inputActions}>
          <Button
            disabled={!newContent.trim()}
            fullWidth
            icon="send"
            label={isSubmitting ? 'Saving Note...' : 'Add Private Note'}
            loading={isSubmitting}
            onPress={handleAddNote}
            variant="primary"
          />
        </View>
      </Card>

      {/* Notes list */}
      <View style={styles.notesList}>
        {notes.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons color={colors.textTertiary} name="document-text-outline" size={28} />
            <Text color="textSecondary" style={styles.emptyText} variant="body">
              No private notes recorded yet.
            </Text>
          </Card>
        ) : (
          notes.map((note) => (
            <Card bordered key={note.id} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <View style={styles.authorGroup}>
                  <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons color={colors.primary} name="person" size={14} />
                  </View>
                  <View>
                    <Text style={{ fontWeight: '700' }} variant="caption">
                      {note.author?.name || note.author?.email}
                    </Text>
                    <Text color="textTertiary" variant="caption">
                      {formatCaseDateTime(note.createdAt)}
                    </Text>
                  </View>
                </View>
                <Badge label="Private" tone="neutral" />
              </View>

              <Text style={styles.noteContent} variant="body">
                {note.content}
              </Text>
            </Card>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  inputCard: {
    padding: Spacing.md,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  textArea: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  inputActions: {
    alignItems: 'flex-end',
  },
  notesList: {
    gap: Spacing.sm,
  },
  noteCard: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  authorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteContent: {
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
  },
});
