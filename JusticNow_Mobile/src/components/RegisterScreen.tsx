import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';
import { Button, Card, Text, useColors } from '@/design-system';
import { Layout, Radius, Spacing } from '@/design-system/spacing';

import { Field, PasswordVisibilityButton } from './AuthLayout';

type Role = 'CITIZEN' | 'OFFICER';
type Document = { name: string; size: string; type: string; uri: string; file?: Blob };

const roleDetails: Record<Role, { title: string; description: string; icon: 'person-outline' | 'shield-checkmark-outline' }> = {
  CITIZEN: { title: 'Citizen', description: 'Register as a citizen to report and track human rights cases.', icon: 'person-outline' },
  OFFICER: { title: 'Officer', description: 'Register as an authorized officer to review and manage assigned cases.', icon: 'shield-checkmark-outline' },
};

const passwordRules = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function RegisterScreen() {
  const colors = useColors();
  const router = useRouter();
  const { register } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [step, setStep] = useState(0);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', contact: '', officerId: '', organization: '', department: '', designation: '', governmentId: '', lawyerNumber: '', firm: '', practice: '', experience: '' });

  const setValue = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const maxStep = role === 'CITIZEN' ? 1 : 2;
  const stepLabels = role === 'CITIZEN' ? ['Account details'] : ['Personal', 'Identity', 'Review'];
  const updateDocument = async (label: string) => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ['image/jpeg', 'image/png', 'application/pdf'],
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setDocuments((current) => ({ ...current, [label]: { name: asset.name || `${label}.jpg`, size: `${Math.max(1, Math.round((asset.size || 400000) / 1000))} KB`, type: asset.mimeType || 'application/octet-stream', uri: asset.uri, file: (asset as any).file } }));
  };
  const removeDocument = (label: string) => setDocuments((current) => {
    const next = { ...current };
    delete next[label];
    return next;
  });

  const validate = () => {
    if (!form.name.trim() || !form.email.includes('@')) return 'Enter your full name and a valid email address.';
    if (!passwordRules.every((rule) => rule.test(form.password))) return 'Please meet all password requirements.';
    if (form.password !== form.confirm) return 'Passwords do not match.';
    if (role !== 'CITIZEN' && !form.contact.trim()) return 'Enter a contact number.';
    if (role === 'OFFICER' && step === 1 && (!form.officerId || !form.organization || !form.department || !form.designation || !form.governmentId || Object.keys(documents).length < 2)) return 'Complete every identity field and upload both documents.';
    return '';
  };

  const next = async () => {
    setError('');
    if (!role) return setError('Choose an account type to continue.');
    if (step === 0) {
      const validation = validate();
      if (validation) return setError(validation);
    }
    if (role === 'CITIZEN' && step === 1 && (!terms || !privacy)) return setError('Accept the Terms and Conditions and Privacy Policy to continue.');
    if (step < maxStep) return setStep((current) => current + 1);
    setIsSubmitting(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        contactNumber: form.contact,
        fields: {
          officerId: form.officerId,
          organization: form.organization,
          department: form.department,
          designation: form.designation,
          governmentId: form.governmentId,
          lawyerNumber: form.lawyerNumber,
          firm: form.firm,
          practice: form.practice,
          experience: form.experience,
        },
        documents: Object.values(documents).map((document) => ({ uri: document.uri, name: document.name, type: document.type, file: document.file })),
        documentTypes: Object.keys(documents),
      });
      setComplete(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to create your account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const back = () => { setError(''); if (step > 0) setStep((current) => current - 1); else if (role) setRole(null); else router.replace('/login'); };

  if (complete) return <CompletionScreen role={role!} onLogin={() => router.replace('/login')} />;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.container, { backgroundColor: colors.canvas }]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.brandMark, { backgroundColor: colors.primarySoft }]}><Ionicons color={colors.primary} name="shield-checkmark" size={28} /></View>
        <Text color="primary" variant="eyebrow">JUSTICENOW</Text>
        <Text style={styles.title} variant="display">Create a safe space.</Text>
        <Text color="textSecondary" style={styles.subtitle}>A secure account for reporting, reviewing, and supporting human-rights cases.</Text>

        {role ? <Progress step={step} labels={stepLabels} /> : null}
        {!role ? <RolePicker colors={colors} onSelect={setRole} selected={role} /> : step === 0 ? <PersonalStep colors={colors} form={form} role={role} setValue={setValue} showConfirm={showConfirm} showPassword={showPassword} setShowConfirm={setShowConfirm} setShowPassword={setShowPassword} /> : role === 'OFFICER' && step === 1 ? <OfficerVerification colors={colors} documents={documents} form={form} onRemove={removeDocument} onUpload={updateDocument} setValue={setValue} /> : <ReviewStep colors={colors} documents={documents} form={form} role={role} />}

        {role === 'CITIZEN' && step === 1 ? <Consent colors={colors} privacy={privacy} setPrivacy={setPrivacy} setTerms={setTerms} terms={terms} /> : null}
        {error ? <View style={[styles.error, { backgroundColor: colors.dangerSoft }]}><Ionicons color={colors.danger} name="alert-circle-outline" size={20} /><Text color="danger" style={styles.errorText}>{error}</Text></View> : null}
        <View style={styles.actions}><Button fullWidth label={step === maxStep ? (role === 'CITIZEN' ? 'Create citizen account' : 'Submit for Verification') : 'Continue'} loading={isSubmitting} onPress={next} icon="arrow-forward" /><Button fullWidth label={step === 0 && !role ? 'Back to Login' : 'Back'} onPress={back} variant="secondary" /></View>
        <View style={styles.privacyRow}><Ionicons color={colors.success} name="lock-closed-outline" size={17} /><Text color="textTertiary" style={styles.privacy}>Identity documents are confidential and reviewed only by authorized administrators.</Text></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RolePicker({ colors, onSelect, selected }: { colors: ReturnType<typeof useColors>; onSelect: (role: Role) => void; selected: Role | null }) {
  return <View style={styles.section}><Text variant="heading">What type of account do you need?</Text><Text color="textSecondary" style={styles.sectionHint}>Choose the role that best describes how you will use JusticeNow.</Text>{(Object.keys(roleDetails) as Role[]).map((item) => { const detail = roleDetails[item]; const active = selected === item; return <Pressable accessibilityRole="radio" accessibilityState={{ selected: active }} key={item} onPress={() => onSelect(item)} style={[styles.roleCard, { backgroundColor: colors.surface, borderColor: active ? colors.primary : colors.border }]}><View style={[styles.roleIcon, { backgroundColor: active ? colors.primarySoft : colors.surfaceMuted }]}><Ionicons color={active ? colors.primary : colors.textSecondary} name={detail.icon} size={22} /></View><View style={styles.roleCopy}><Text variant="bodyStrong">{detail.title}</Text><Text color="textSecondary" variant="caption">{detail.description}</Text></View>{active ? <Ionicons color={colors.primary} name="checkmark-circle" size={22} /> : <Ionicons color={colors.textTertiary} name="ellipse-outline" size={22} />}</Pressable>; })}</View>;
}

function Progress({ step, labels }: { step: number; labels: string[] }) { return <View style={styles.progress}>{labels.map((label, index) => <View key={label} style={styles.progressItem}><View style={[styles.progressDot, index <= step && styles.progressActive]}><Text style={index <= step ? styles.progressTextActive : styles.progressText}>{index + 1}</Text></View><Text color={index <= step ? 'primary' : 'textTertiary'} variant="caption">{label}</Text>{index < labels.length - 1 ? <View style={[styles.progressLine, index < step && styles.progressLineActive]} /> : null}</View>)}</View>; }

function PersonalStep({ colors, form, role, setValue, showConfirm, showPassword, setShowConfirm, setShowPassword }: any) { return <View style={styles.section}><Text variant="heading">{role === 'CITIZEN' ? 'Create your account' : 'Personal information'}</Text><Text color="textSecondary" style={styles.sectionHint}>{role === 'CITIZEN' ? 'Use an email you can access to receive important case updates.' : 'Your account will stay pending until verification is complete.'}</Text><Field colors={colors} label="Full name *" onChangeText={(value) => setValue('name', value)} placeholder="Your full name" value={form.name} /><Field autoCapitalize="none" colors={colors} keyboardType="email-address" label={role === 'OFFICER' ? 'Gmail / official email *' : 'Gmail / email address *'} onChangeText={(value) => setValue('email', value)} placeholder="you@example.com" value={form.email} /><Field colors={colors} label="Password *" onChangeText={(value) => setValue('password', value)} placeholder="Create a strong password" secureTextEntry={!showPassword} trailing={<PasswordVisibilityButton onPress={() => setShowPassword(!showPassword)} visible={showPassword} />} value={form.password} /><View style={styles.rules}>{passwordRules.map((rule) => <View key={rule.label} style={styles.rule}><Ionicons color={rule.test(form.password) ? colors.success : colors.textTertiary} name={rule.test(form.password) ? 'checkmark-circle' : 'ellipse-outline'} size={16} /><Text color={rule.test(form.password) ? 'success' : 'textSecondary'} variant="caption">{rule.label}</Text></View>)}</View><Field colors={colors} label="Confirm password *" onChangeText={(value) => setValue('confirm', value)} placeholder="Repeat your password" secureTextEntry={!showConfirm} trailing={<PasswordVisibilityButton onPress={() => setShowConfirm(!showConfirm)} visible={showConfirm} />} value={form.confirm} />{role !== 'CITIZEN' ? <Field colors={colors} keyboardType="phone-pad" label="Contact number *" onChangeText={(value) => setValue('contact', value)} placeholder="Your contact number" value={form.contact} /> : null}</View>; }

function OfficerVerification({ colors, documents, form, onRemove, onUpload, setValue }: any) { return <View style={styles.section}><Text variant="heading">Officer identity verification</Text><Text color="textSecondary" style={styles.sectionHint}>Tell us where you serve and upload official proof. An administrator reviews this securely before activation.</Text><Field colors={colors} label="Officer ID / Employee ID *" onChangeText={(value) => setValue('officerId', value)} placeholder="e.g. JN-2048" value={form.officerId} /><Field colors={colors} label="Organization / Department *" onChangeText={(value) => setValue('organization', value)} placeholder="Organization name" value={form.organization} /><Field colors={colors} label="Department *" onChangeText={(value) => setValue('department', value)} placeholder="Department" value={form.department} /><Field colors={colors} label="Designation *" onChangeText={(value) => setValue('designation', value)} placeholder="Your designation" value={form.designation} /><Field colors={colors} label="Government or organization ID number *" onChangeText={(value) => setValue('governmentId', value)} placeholder="Identification number" value={form.governmentId} /><DocumentStep colors={colors} documents={documents} labels={['Identity Document', 'Officer Identification / Official Document']} onRemove={onRemove} onUpload={onUpload} /></View>; }

function LawyerProfessional({ colors, form, setValue }: any) { return <View style={styles.section}><Text variant="heading">Professional information</Text><Text color="textSecondary" style={styles.sectionHint}>This information helps administrators verify your legal practice.</Text><Field colors={colors} label="Lawyer / attorney registration number *" onChangeText={(value) => setValue('lawyerNumber', value)} placeholder="Registration number" value={form.lawyerNumber} /><Field colors={colors} label="Legal organization / firm *" onChangeText={(value) => setValue('firm', value)} placeholder="Firm or organization" value={form.firm} /><Field colors={colors} label="Area of legal practice *" onChangeText={(value) => setValue('practice', value)} placeholder="e.g. Human rights law" value={form.practice} /><Field colors={colors} keyboardType="numeric" label="Years of experience *" onChangeText={(value) => setValue('experience', value)} placeholder="Number of years" value={form.experience} /></View>; }

function DocumentStep({ colors, documents, labels, onRemove, onUpload }: any) { return <View style={styles.uploadSection}>{labels.map((label: string) => { const document = documents[label]; return <View key={label} style={styles.uploadGroup}><Text variant="bodyStrong">{label} *</Text><Text color="textSecondary" variant="caption">Upload a clear, current document. JPG, PNG or PDF up to 10 MB.</Text><Pressable accessibilityRole="button" onPress={() => onUpload(label)} style={[styles.dropzone, { backgroundColor: colors.surfaceMuted, borderColor: colors.borderStrong }]}><Ionicons color={colors.primary} name={document ? 'document-attach' : 'cloud-upload-outline'} size={24} /><View style={styles.uploadCopy}><Text variant="bodyStrong">{document ? document.name : 'Choose a secure file'}</Text><Text color="textSecondary" variant="caption">{document ? `${document.size} · Ready to review` : 'Browse files or drag and drop'}</Text></View>{document ? <Pressable accessibilityLabel={`Remove ${label}`} onPress={() => onRemove(label)}><Ionicons color={colors.danger} name="trash-outline" size={20} /></Pressable> : <Ionicons color={colors.textTertiary} name="add-circle-outline" size={20} />}</Pressable></View>; })}<View style={[styles.notice, { backgroundColor: colors.primarySoft }]}><Ionicons color={colors.primary} name="lock-closed-outline" size={19} /><Text color="primary" style={styles.noticeText} variant="caption">Your documents will be securely reviewed by an administrator before your account is activated.</Text></View></View>; }

function ReviewStep({ colors, documents, form, role }: any) { return <View style={styles.section}><Text variant="heading">Review and submit</Text><Text color="textSecondary" style={styles.sectionHint}>Check your information before sending it for secure review.</Text><Card style={styles.reviewCard}><ReviewRow label="Full name" value={form.name} /><ReviewRow label="Email" value={form.email} /><ReviewRow label="Account type" value={roleDetails[role as Role].title} /><ReviewRow label="Officer ID" value={form.officerId} /><ReviewRow label="Organization" value={form.organization} /><ReviewRow label="Documents" value={`${Object.keys(documents).length} uploaded`} /></Card></View>; }
function ReviewRow({ label, value }: { label: string; value: string }) { return <View style={styles.reviewRow}><Text color="textSecondary" variant="caption">{label}</Text><Text style={styles.reviewValue} variant="bodyStrong">{value || 'Not provided'}</Text></View>; }
function Consent({ colors, privacy, setPrivacy, setTerms, terms }: any) { return <View style={styles.consent}>{[['terms', 'I agree to the Terms and Conditions', terms, setTerms], ['privacy', 'I agree to the Privacy Policy', privacy, setPrivacy]].map(([key, label, value, setter]: any) => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} key={key} onPress={() => setter(!value)} style={styles.consentRow}><View style={[styles.checkbox, { backgroundColor: value ? colors.primary : colors.surface, borderColor: value ? colors.primary : colors.borderStrong }]}>{value ? <Ionicons color={colors.textOnPrimary} name="checkmark" size={15} /> : null}</View><Text style={styles.consentLabel} variant="caption">{label}</Text></Pressable>)}</View>; }
function CompletionScreen({ onLogin, role }: { onLogin: () => void; role: Role }) { const colors = useColors(); const pending = role !== 'CITIZEN'; return <View style={[styles.complete, { backgroundColor: colors.canvas }]}><View style={[styles.successIcon, { backgroundColor: pending ? colors.warningSoft : colors.successSoft }]}><Ionicons color={pending ? colors.warning : colors.success} name={pending ? 'time-outline' : 'checkmark'} size={36} /></View><Text style={styles.completeTitle} variant="heading">{pending ? 'Registration submitted successfully.' : 'Your citizen account has been created successfully.'}</Text><Text color="textSecondary" style={styles.completeText} variant="body">{pending ? `Your ${role.toLowerCase()} account is currently pending verification. An administrator will review your submitted information and documents. You will not receive protected access until approval.` : 'You can now sign in and begin reporting and tracking human-rights cases.'}</Text><Button fullWidth label="Continue to Login" onPress={onLogin} icon="arrow-forward" /></View>; }

const styles = StyleSheet.create({ container: { flex: 1 }, content: { flexGrow: 1, padding: Layout.screenPadding, paddingVertical: Spacing.huge }, brandMark: { alignItems: 'center', borderRadius: Radius.lg, height: 60, justifyContent: 'center', marginBottom: Spacing.lg, width: 60 }, title: { marginBottom: Spacing.sm, marginTop: Spacing.sm }, subtitle: { marginBottom: Spacing.xxl, maxWidth: 460 }, section: { gap: Spacing.md, marginBottom: Spacing.lg }, sectionHint: { marginBottom: Spacing.sm }, roleCard: { alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1.5, flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg }, roleIcon: { alignItems: 'center', borderRadius: Radius.md, height: 44, justifyContent: 'center', width: 44 }, roleCopy: { flex: 1, gap: 4 }, progress: { flexDirection: 'row', marginBottom: Spacing.xxl }, progressItem: { alignItems: 'center', flex: 1, gap: 6, position: 'relative' }, progressDot: { alignItems: 'center', backgroundColor: '#E2E8F0', borderRadius: 20, height: 28, justifyContent: 'center', width: 28 }, progressActive: { backgroundColor: '#DCEBFF' }, progressText: { color: '#64748B', fontSize: 12, fontWeight: '700' }, progressTextActive: { color: '#1D4ED8', fontSize: 12, fontWeight: '700' }, progressLine: { backgroundColor: '#E2E8F0', height: 2, left: '62%', position: 'absolute', right: '-38%', top: 13 }, progressLineActive: { backgroundColor: '#2563EB' }, rules: { gap: 6, marginTop: -Spacing.sm }, rule: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }, uploadSection: { gap: Spacing.lg, marginBottom: Spacing.lg }, uploadGroup: { gap: Spacing.sm }, dropzone: { alignItems: 'center', borderRadius: Radius.md, borderStyle: 'dashed', borderWidth: 1, flexDirection: 'row', gap: Spacing.md, padding: Spacing.md }, uploadCopy: { flex: 1, gap: 2 }, notice: { alignItems: 'flex-start', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md }, noticeText: { flex: 1 }, reviewCard: { gap: Spacing.md }, reviewRow: { borderBottomColor: '#E2E8F0', borderBottomWidth: StyleSheet.hairlineWidth, gap: 4, paddingBottom: Spacing.sm }, reviewValue: { textTransform: 'none' }, consent: { gap: Spacing.md, marginBottom: Spacing.lg }, consentRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm }, checkbox: { alignItems: 'center', borderRadius: 5, borderWidth: 1, height: 22, justifyContent: 'center', width: 22 }, consentLabel: { flex: 1 }, error: { alignItems: 'flex-start', borderRadius: Radius.md, flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg, padding: Spacing.md }, errorText: { flex: 1 }, actions: { gap: Spacing.sm }, privacyRow: { alignItems: 'center', flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginTop: Spacing.xxxl }, privacy: { flex: 1, textAlign: 'center' }, complete: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: Layout.screenPadding }, successIcon: { alignItems: 'center', borderRadius: 40, height: 72, justifyContent: 'center', marginBottom: Spacing.xxl, width: 72 }, completeTitle: { textAlign: 'center' }, completeText: { marginBottom: Spacing.xxl, marginTop: Spacing.md, maxWidth: 440, textAlign: 'center' } });