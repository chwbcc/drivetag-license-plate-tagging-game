import { StyleSheet } from 'react-native';
import Colors from './colors';

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  xxxxl: 60,
} as const;

const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  xxxxl: 32,
  xxxxxl: 40,
  xxxxxxl: 48,
} as const;

const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const;

const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

const darkMode = {
  background: '#0F172A',
  card: '#1E293B',
  surface: '#334155',
  text: '#FFFFFF',
  textSecondary: '#94A3B8',
  border: '#475569',
} as const;

export const CommonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: spacing.lg,
  },
  darkContainer: {
    flex: 1,
    backgroundColor: darkMode.background,
    padding: spacing.lg,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadows.md,
  },
  darkCard: {
    backgroundColor: darkMode.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: darkMode.border,
    ...shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.xl,
  },
});

export const TextStyles = StyleSheet.create({
  title: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: Colors.text,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  heading: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: Colors.text,
  },
  subheading: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: Colors.text,
  },
  body: {
    fontSize: fontSize.base,
    color: Colors.text,
  },
  bodySecondary: {
    fontSize: fontSize.base,
    color: Colors.textSecondary,
  },
  caption: {
    fontSize: fontSize.sm,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: Colors.text,
  },
  error: {
    fontSize: fontSize.sm,
    color: Colors.error,
  },
  darkTitle: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: darkMode.text,
  },
  darkSubtitle: {
    fontSize: fontSize.base,
    color: darkMode.textSecondary,
    textAlign: 'center',
  },
  darkBody: {
    fontSize: fontSize.base,
    color: darkMode.text,
  },
});

export const ButtonStyles = StyleSheet.create({
  primary: {
    backgroundColor: Colors.primary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: {
    backgroundColor: Colors.secondary,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  success: {
    backgroundColor: Colors.success,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    backgroundColor: Colors.border,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: '#FFFFFF',
  },
  outlineText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: Colors.primary,
  },
  disabledText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: Colors.textSecondary,
  },
});

export const InputStyles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: Colors.text,
    marginBottom: spacing.xs + 2,
  },
  darkLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: darkMode.text,
    marginBottom: spacing.xs + 2,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: Colors.text,
  },
  darkInput: {
    backgroundColor: darkMode.card,
    borderWidth: 1,
    borderColor: darkMode.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: darkMode.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  inputDisabled: {
    backgroundColor: Colors.border,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
});

export const CardStyles = StyleSheet.create({
  base: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...shadows.md,
  },
  elevated: {
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.lg,
  },
  positive: {
    backgroundColor: Colors.success + '05',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  negative: {
    backgroundColor: Colors.primary + '05',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  warning: {
    backgroundColor: Colors.warning + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  error: {
    backgroundColor: Colors.error + '10',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
});

export const IconContainerStyles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primary: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: Colors.primary + '10',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  success: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: Colors.success + '10',
    borderWidth: 1,
    borderColor: Colors.success + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondary: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.xl,
    backgroundColor: Colors.secondary + '10',
    borderWidth: 1,
    borderColor: Colors.secondary + '30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  large: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const TabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    gap: spacing.xs + 2,
  },
  activeTab: {
    backgroundColor: Colors.primary + '20',
  },
  activeSuccessTab: {
    backgroundColor: Colors.success + '20',
  },
  tabText: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
  },
  activeTabText: {
    fontSize: fontSize.md,
    color: Colors.primary,
    fontWeight: fontWeight.medium,
  },
  activeSuccessTabText: {
    fontSize: fontSize.md,
    color: Colors.success,
    fontWeight: fontWeight.medium,
  },
});

export const FloatingButtonStyles = StyleSheet.create({
  base: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  primary: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  success: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
  large: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.xl,
  },
});

export const PelletCountStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    marginRight: spacing.xs,
  },
  value: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: Colors.primary,
  },
  positiveValue: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    color: Colors.success,
  },
});

export const EmptyStateStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxxxl + spacing.xl,
  },
  emoji: {
    fontSize: fontSize.xxxxxxl,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: Colors.text,
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: '80%',
  },
});

export const LogoStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  primary: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  secondary: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xxl,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emoji: {
    fontSize: fontSize.xxxxxl,
  },
});

export const InfoBoxStyles = StyleSheet.create({
  success: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: Colors.success + '15',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  warning: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: Colors.warning + '15',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  error: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: Colors.error + '15',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  info: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: Colors.primary + '15',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  text: {
    fontSize: fontSize.md,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  successText: {
    fontSize: fontSize.md,
    color: Colors.success,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  warningText: {
    fontSize: fontSize.md,
    color: Colors.warning,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  errorText: {
    fontSize: fontSize.md,
    color: Colors.error,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
  infoText: {
    fontSize: fontSize.md,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: fontWeight.medium,
  },
});

export { spacing, borderRadius, fontSize, fontWeight, shadows, darkMode };
