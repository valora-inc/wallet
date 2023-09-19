import { StyleSheet } from 'react-native'
import colors from 'src/styles/colors'

const Inter = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  SemiBold: 'Inter-SemiBold',
}

const Jost = {
  Book: 'Jost-Book',
  Medium: 'Jost-Medium',
}

export const fontFamily = Inter.Regular

const standards = {
  large: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  regular: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  small: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  xsmall: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
}

/**
 * Figma TypeScale Styles
 */
export const typeScale = StyleSheet.create({
  displayLarge: {
    fontFamily: Inter.Regular,
    fontSize: 80,
    lineHeight: 80,
    fontWeight: '700',
    letterSpacing: -3,
  },
  displayMedium: {
    fontFamily: Inter.Regular,
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '700',
    letterSpacing: -2,
  },
  displaySmall: {
    fontFamily: Inter.Regular,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -2,
  },
  titleLarge: {
    fontFamily: Inter.Regular,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  titleMedium: {
    fontFamily: Inter.Regular,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  },
  titleSmall: {
    fontFamily: Inter.Regular,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  labelLarge: {
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
  },
  labelMedium: {
    fontFamily: Inter.Regular,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  labelSmall: {
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  labelXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  labelXXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 2,
  },
  bodyLarge: {
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
    paragraphSpacing: 18,
  },
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
    paragraphSpacing: 16,
  },
  bodySmall: {
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    paragraphSpacing: 14,
  },
  bodyXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
    letterSpacing: 1,
    paragraphSpacing: 12,
  },
  bodyXXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '400',
    letterSpacing: 2,
  },
})

/***
 * @deprecated
 * Use typeScale instead
 */
export const fontStyles = StyleSheet.create({
  h1: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: Jost.Book,
    color: colors.dark,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  sectionHeader: {
    fontSize: 14,
    lineHeight: 16,
    fontFamily: Inter.Medium,
    color: colors.dark,
  },
  navigationHeader: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  notificationHeadline: {
    fontSize: 18,
    lineHeight: 22,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  displayName: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Jost.Medium,
    color: colors.dark,
  },
  label: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: Inter.SemiBold,
    color: colors.dark,
  },
  large: standards.large,
  regular: standards.regular,
  small: standards.small,
  xsmall: standards.xsmall,
  large600: { ...standards.large, fontFamily: Inter.SemiBold },
  regular600: { ...standards.regular, fontFamily: Inter.SemiBold },
  small600: { ...standards.small, fontFamily: Inter.SemiBold },
  xsmall600: { ...standards.xsmall, fontFamily: Inter.SemiBold },
  large500: { ...standards.large, fontFamily: Inter.Medium },
  regular500: { ...standards.regular, fontFamily: Inter.Medium },
  small500: { ...standards.small, fontFamily: Inter.Medium },
  xsmall500: { ...standards.xsmall, fontFamily: Inter.Medium },
  center: {
    textAlign: 'center',
  },
  mediumNumber: {
    lineHeight: 27,
    fontSize: 24,
    fontFamily: Inter.Regular,
    color: colors.dark,
  },
  largeNumber: {
    lineHeight: 40,
    fontSize: 32,
    fontFamily: Inter.SemiBold,
    color: colors.dark,
  },
  iconText: {
    fontSize: 16,
    fontFamily: Inter.Medium,
    color: colors.light,
  },
  emptyState: {
    ...standards.large,
    color: colors.gray3,
    textAlign: 'center',
  },
})

// TODO: export typeScale as default when all components are updated
export default fontStyles

// map of deprecated font names to new font styles.
export const oldFontsStyles = StyleSheet.create({
  body: fontStyles.regular,
  bodySmall: fontStyles.small,
  bodySmallBold: fontStyles.small600,
  bodyBold: fontStyles.regular600,
  bodySmallSemiBold: fontStyles.small600,
  sectionLabel: fontStyles.sectionHeader,
  sectionLabelNew: fontStyles.sectionHeader,
  headerTitle: fontStyles.regular600,
})
