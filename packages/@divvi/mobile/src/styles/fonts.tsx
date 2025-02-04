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
    color: Colors.contentPrimary,
  },
  displayMedium: {
    fontFamily: Inter.Bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.12,
    color: Colors.contentPrimary,
  },
  displaySmall: {
    fontFamily: Inter.Bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: Colors.contentPrimary,
  },
  titleLarge: {
    fontFamily: Inter.Bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.32,
    color: Colors.contentPrimary,
  },
  titleMedium: {
    fontFamily: Inter.Bold,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.contentPrimary,
  },
  titleSmall: {
    fontFamily: Inter.Bold,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.contentPrimary,
  },
  labelSemiBoldLarge: {
    fontFamily: Inter.SemiBold,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.contentPrimary,
  },
  labelSemiBoldMedium: {
    fontFamily: Inter.SemiBold,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.contentPrimary,
  },
  labelSemiBoldSmall: {
    fontFamily: Inter.SemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.contentPrimary,
  },
  labelSemiBoldXSmall: {
    fontFamily: Inter.SemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.contentPrimary,
  },
  labelLarge: {
    fontFamily: Inter.Medium,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.contentPrimary,
  },
  labelMedium: {
    fontFamily: Inter.Medium,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.contentPrimary,
  },
  labelSmall: {
    fontFamily: Inter.Medium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.contentPrimary,
  },
  labelXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: Colors.contentPrimary,
  },
  labelXXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: Colors.contentPrimary,
  },
  bodyLarge: {
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.contentPrimary,
  },
  bodyMedium: {
    fontFamily: Inter.Regular,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.contentPrimary,
  },
  bodySmall: {
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.contentPrimary,
  },
  bodyXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: Colors.contentPrimary,
  },
  bodyXXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: Colors.contentPrimary,
  },
})
