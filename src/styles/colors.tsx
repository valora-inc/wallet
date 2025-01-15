// Designer Created Figma Colors
// from https://www.figma.com/design/erFfzHvSTm5g1sjK6jWyEH/Working-Design-System?node-id=2100-4881&node-type=frame&t=vKGGXrs3Torz7kFE-0
enum Colors {
  // backgrounds
  background = '#FFFFFF', // primary background
  backgroundInverse = '#2E3338', // inverse background (e.g. high contrast to primary)

  // text
  textPrimary = '#2E3338', // text on primary background
  textSecondary = '#757575', // supporting, placeholder, or less important text
  textInverse = '#FFFFFF', // text on inverse background

  // borders, shadows, highlights
  shadow = '#2E3338',
  softShadow = 'rgba(156, 164, 169, 0.4)',
  lightShadow = 'rgba(48, 46, 37, 0.15)',
  barShadow = 'rgba(129, 134, 139, 0.5)',
  skeletonPlaceholderHighlight = '#FFFFFF',

  // interactive elements
  navigationTop = '#2E3338',
  navigationTopSecondary = '#757575',
  navigationBottom = '#2E3338',
  navigationBottomSecondary = '#757575',
  buttonPrimary = '#2E3338',
  accent = '#1AB775',
  textLink = '#757575', // similar to secondary text but for interactive links

  // states
  inactive = '#757575', // disabled, inactive, or placeholder

  // states

  // other
  successDark = '#137211',
  successLight = '#F1FDF1',
  warningDark = '#9C6E00',
  warningLight = '#FFF9EA',
  errorDark = '#C93717',
  errorLight = '#FBF2F0',
  gradientBorderLeft = '#26d98a',
  gradientBorderRight = '#ffd52c',

  /** @deprecated */
  infoDark = '#0768AE',
  /** @deprecated */
  onboardingBrownLight = '#A49B80',
  /** @deprecated */
  gray5 = '#505050',
  /** @deprecated */
  gray4 = '#666666',
  /** @deprecated */
  gray3 = '#757575',
  /** @deprecated */
  gray2 = '#E6E6E6',
  /** @deprecated */
  gray1 = '#F8F9F9',
}

export default Colors
