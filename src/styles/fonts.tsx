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
    color: Colors.text,
  },
  displayMedium: {
    fontFamily: Inter.Bold,
    fontSize: 56,
    lineHeight: 64,
    letterSpacing: -1.12,
    color: Colors.text,
  },
  displaySmall: {
    fontFamily: Inter.Bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    color: Colors.text,
  },
  titleLarge: {
    fontFamily: Inter.Bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.32,
    color: Colors.text,
  },
  titleMedium: {
    fontFamily: Inter.Bold,
    fontSize: 24,
    lineHeight: 32,
    color: Colors.text,
  },
  titleSmall: {
    fontFamily: Inter.Bold,
    fontSize: 20,
    lineHeight: 28,
    color: Colors.text,
  },
  labelSemiBoldLarge: {
    fontFamily: Inter.SemiBold,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.text,
  },
  labelSemiBoldMedium: {
    fontFamily: Inter.SemiBold,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  labelSemiBoldSmall: {
    fontFamily: Inter.SemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  labelSemiBoldXSmall: {
    fontFamily: Inter.SemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: Colors.text,
  },
  labelLarge: {
    fontFamily: Inter.Medium,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.text,
  },
  labelMedium: {
    fontFamily: Inter.Medium,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  labelSmall: {
    fontFamily: Inter.Medium,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  labelXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: Colors.text,
  },
  labelXXSmall: {
    fontFamily: Inter.Medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: Colors.text,
  },
  bodyLarge: {
    fontFamily: Inter.Regular,
    fontSize: 18,
    lineHeight: 28,
    color: Colors.text,
  },
  bodyMedium: {
    fontFamily: Inter.Regular,
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  bodySmall: {
    fontFamily: Inter.Regular,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  bodyXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.12,
    color: Colors.text,
  },
  bodyXXSmall: {
    fontFamily: Inter.Regular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.2,
    color: Colors.text,
  },
})
