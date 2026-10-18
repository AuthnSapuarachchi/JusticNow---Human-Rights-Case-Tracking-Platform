import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  COMPLAINT_DETAILS_MIN,
  COMPLAINT_REASONS,
  CONDUCT_TEXT_MAX,
  reportOfficer,
  type CitizenComplaint,
  type ComplaintReason,
} from '@/api/conductApi';
import { Button, Text, useColors } from '@/design-system';
import { Radius, Spacing } from '@/design-system/spacing';
// The bottom-sheet shell and text field are generic; they live with the admin forms that introduced them.
import { AdminSheet, FormField } from '@/features/admin/components';

interface ReportOfficerSheetProps {
  visible: boolean;
  caseId: string;
  officerName: string;
  onClose: () => void;
  onSubmitted: (complaint: CitizenComplaint) => void;
}

/** Citizen reports the officer on their case. Admins review it; the officer never sees it. */
export function ReportOfficerSheet({ visible, caseId, officerName, onClose, onSubmitted }: ReportOfficerSheetProps) {
  const colors = useColors();
  const [reason, setReason] = useState<ComplaintReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leave nothing behind for the next time the sheet opens.
  const reset = () => {
    setReason(null);
    setDetails('');
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const trimmed = details.trim();
  const remaining = COMPLAINT_DETAILS_MIN - trimmed.length;
  const canSubmit = Boolean(reason) && remaining <= 0 && !submitting;

  const handleSubmit = async () => {
    if (!reason || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const complaint = await reportOfficer(caseId, { reason, details: trimmed });
      reset();
      onSubmitted(complaint);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'We could not send your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminSheet
      description={`Tell us if ${officerName} is not handling your case properly. JusticeNow admins will look into it.`}
      icon="flag-outline"
      onClose={handleClose}
      title="Report a problem"
      visible={visible}
    >
      <View style={[styles.privacy, { backgroundColor: colors.successSoft }]}>
        <Ionicons color={colors.success} name="lock-closed" size={20} />
        <Text style={styles.flex} variant="caption">
          Your officer will not see this report or who sent it. Only JusticeNow admins can read it.
        </Text>
      </View>

      <Text variant="bodyStrong">What went wrong?</Text>
      <View accessibilityRole="radiogroup" style={styles.reasons}>
        {COMPLAINT_REASONS.map((item) => {
          const selected = reason === item.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={item.value}
              onPress={() => setReason(item.value)}
              style={({ pressed }) => [
                styles.reason,
                {
                  backgroundColor: selected ? colors.primarySoft : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <Ionicons color={selected ? colors.primary : colors.textSecondary} name={item.icon} size={22} />
              <View style={styles.flex}>
                <Text variant="bodyStrong">{item.label}</Text>
                <Text color="textSecondary" variant="caption">{item.hint}</Text>
              </View>
              <Ionicons color={selected ? colors.primary : colors.borderStrong} name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} />
            </Pressable>
          );
        })}
      </View>

      <FormField
        label="What happened?"
        maxLength={CONDUCT_TEXT_MAX}
        multiline
        onChangeText={setDetails}
        placeholder="For example: I sent three messages over two weeks and got no reply."
        value={details}
      />
      <Text color="textTertiary" variant="caption">
        {remaining > 0 ? `Write at least ${remaining} more character${remaining === 1 ? '' : 's'}.` : `${trimmed.length}/${CONDUCT_TEXT_MAX}`}
      </Text>

      {error ? (
        <View accessibilityRole="alert" style={[styles.error, { backgroundColor: colors.dangerSoft }]}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={18} />
          <Text color="danger" style={styles.flex} variant="caption">{error}</Text>
        </View>
      ) : null}

      <Button disabled={!canSubmit} fullWidth icon="send-outline" iconPosition="leading" label="Send report" loading={submitting} onPress={handleSubmit} />
      <Button fullWidth label="Cancel" onPress={handleClose} variant="ghost" />
    </AdminSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.75 },
  privacy: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.md, padding: Spacing.md },
  reasons: { gap: Spacing.sm },
  reason: { alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, flexDirection: 'row', gap: Spacing.md, minHeight: 56, padding: Spacing.md },
  error: { alignItems: 'center', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
});
