import { StyleSheet } from 'react-native'
import Colors from 'src/styles/colors'

const Inter = {
  Regular: 'Inter-Regular',
  Medium: 'Inter-Medium',
  SemiBold: 'Inter-SemiBold',
  Bold: 'Inter-Bold',
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
    color: Colors.textPrimary,
  },
  displayMedium: {
    fontFamily: Inter.Bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.12,
    color: Colors.textPrimary,
  },
  displaySmall: {
    fontFamily: Inter.Bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: Colors.textPrimary,
  },
  titleLarge: {
    fontFamily: Inter.Bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.32,
    color: Colors.textPrimary,
  },
  titleMedium: {
    fontFamily: Inter.Bold,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.textPrimary,
  },
  titleSmall: {
    fontFamily: Inter.Bold,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  labelSemiBoldLarge: {
    fontFamily: Inter.SemiBold,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  labelSemiBoldMedium: {
    fontFamily: Inter.SemiBold,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  labelSemiBoldSmall: {
    fontFamily: Inter.SemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  labelSemiBoldXSmall: {
    fontFamily: Inter.SemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textPrimary,
  },
  labelLarge: {
    fontFamily: Inter.Medium,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  labelMedium: {
    fontFamily: Inter.Medium,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  labelSmall: {
    fontFamily: Inter.Medium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  labelXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: Colors.textPrimary,
  },
  labelXXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: Colors.textPrimary,
  },
  bodyLarge: {
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.textPrimary,
  },
  bodyMedium: {
    fontFamily: Inter.Regular,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.textPrimary,
  },
  bodySmall: {
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textPrimary,
  },
  bodyXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: Colors.textPrimary,
  },
  bodyXXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: Colors.textPrimary,
  },
})
