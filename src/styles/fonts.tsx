import { StyleSheet } from 'react-native'
import colors from 'src/styles/colors'

const Inter = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  SemiBold: 'Inter-SemiBold',
  Bold: 'Inter-Bold',
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
    fontFamily: Inter.Bold,
    fontSize: 80,
    lineHeight: 80,
    letterSpacing: -2.4,
  },
  displayMedium: {
    fontFamily: Inter.Bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.12,
  },
  displaySmall: {
    fontFamily: Inter.Bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  titleLarge: {
    fontFamily: Inter.Bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.32,
  },
  titleMedium: {
    fontFamily: Inter.Bold,
    fontSize: 24,
    lineHeight: 32,
  },
  titleSmall: {
    fontFamily: Inter.Bold,
    fontSize: 20,
    lineHeight: 28,
  },
  semiBoldLarge: {
    fontFamily: Inter.SemiBold,
    fontSize: 18,
    lineHeight: 28,
  },
  semiBoldMedium: {
    fontFamily: Inter.SemiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  labelLarge: {
    fontFamily: Inter.Medium,
    fontSize: 18,
    lineHeight: 28,
  },
  labelMedium: {
    fontFamily: Inter.Medium,
    fontSize: 16,
    lineHeight: 24,
  },
  labelSmall: {
    fontFamily: Inter.Medium,
    fontSize: 14,
    lineHeight: 20,
  },
  labelXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
  },
  labelXXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
  bodyLarge: {
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
  },
  bodyMedium: {
    fontFamily: Inter.Regular,
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
  },
  bodyXXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
})

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
