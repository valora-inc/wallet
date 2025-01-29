import { getAppConfig } from 'src/appConfig'

// Designer Created Figma Colors
// from https://www.figma.com/design/erFfzHvSTm5g1sjK6jWyEH/Working-Design-System?node-id:2100-4881&node-type:frame&t:vKGGXrs3Torz7kFE-0
const colors = {
  // backgrounds
  backgroundPrimary: '#FFFFFF', // Main background color for the app, used for primary surfaces (screens, navigation).
  backgroundSecondary: '#F8F9F9', // Subtle contrast background for secondary surfaces like cards, panels, or inputs.
  backgroundTertiary: '#E6E6E6', // Low-emphasis background for subtle supporting areas, typically used when both primary and secondary backgrounds are present, and an additional layer of distinction is needed.
  backgroundScrim: '#000000', // Semi-transparent underlay behind bottom sheets, modals, dialogs, and other temporary surfaces to dim the background.

  // text, icons, and other content
  contentPrimary: '#2E3338', // main content on primary background
  contentSecondary: '#757575', // supporting context on primary background
  contentTertiary: '#FFFFFF', // content on colored backgrounds
  textLink: '#757575', // underlined text links on primary background

  // borders, shadows, highlights, visual effects
  borderPrimary: '#E6E6E6', // Border color used to create emphasis or highlight key areas.
  borderSecondary: '#E6E6E6', // Border color used to define or separate secondary content.
  softShadow: 'rgba(156, 164, 169, 0.4)',
  lightShadow: 'rgba(48, 46, 37, 0.15)',
  barShadow: 'rgba(129, 134, 139, 0.5)',
  skeletonPlaceholderHighlight: '#FFFFFF', // animated highlight color on skeleton loaders
  skeletonPlaceholderBackground: '#E6E6E6', // background color on skeleton loaders
  loadingIndicator: '#1AB775', // spinner or loading indicator

  // interactive elements
  navigationTopPrimary: '#2E3338', // color for text and icons on top navigation
  navigationTopSecondary: '#757575', // secondary color for text and icons on top navigation
  navigationBottomPrimary: '#2E3338', // color for text and icons on bottom navigation
  navigationBottomSecondary: '#757575', // secondary color for text and icons on bottom navigation
  bottomSheetHandle: '#757575', // color for bottom sheet handle
  buttonPrimaryBackground: '#2E3338', // Background color for primary buttons (high-priority actions).
  buttonPrimaryContent: '#FFFFFF', // Text and icon color for primary buttons.
  buttonPrimaryBorder: '#2E3338', // Border color for primary buttons.
  buttonSecondaryBackground: '#F8F9F9', // Background color for secondary buttons (less emphasized actions).
  buttonSecondaryContent: '#2E3338', // Text and icon color for secondary buttons.
  buttonSecondaryBorder: '#E6E6E6', // Border color for secondary buttons.
  buttonTertiaryBackground: '#FFFFFF', // Background color for tertiary buttons (minimal or low-emphasis actions).
  buttonTertiaryContent: '#2E3338', // Text and icon color for tertiary buttons.
  buttonTertiaryBorder: '#E6E6E6', // Border color for tertiary buttons.
  buttonQuickActionBackground: '#F1FDF1', // Background color for quick action buttons (specialized high-priority actions).
  buttonQuickActionContent: '#137211', // Text and icon color for quick action buttons.
  buttonQuickActionBorder: '#F1FDF1', // Border color for quick action buttons.
  textInputBackground: '#FFFFFF', // Background color for text input fields.
  qrTabBarPrimary: '#2E3338', // color for text and icons on QR tab bar
  qrTabBarSecondary: '#FFFFFF', // secondary color for text and icons on QR tab bar

  // statuses and UI feedback colors
  disabled: '#E6E6E6', // Used for disabled elements that are non-interactive or visually de-emphasized.
  inactive: '#757575', // Represents inactive or placeholder elements, often less prominent but still visible.
  info: '#F8F9F9', // Background for neutral or informational states, typically non-critical.
  successPrimary: '#137211', // Indicates successful actions or positive states, often used for icons or highlights.
  successSecondary: '#F1FDF1', // Subtle background for success states, such as notifications or banners.
  warningPrimary: '#9C6E00', // Highlights warning states, used to draw attention to cautionary information.
  warningSecondary: '#FFF9EA', // Subtle background for warning states, providing gentle emphasis without overpowering.
  errorPrimary: '#C93717', // Represents error or failure states, used for critical feedback or alerts.
  errorSecondary: '#FBF2F0', // Subtle background for error states, providing softer emphasis in contexts like modals or notifications.

  // brand colors for decorative elements
  accent: '#1AB775', // Accent color for emphasizing key elements, such as highlights, icons, or decorative details.
  brandGradientLeft: '#26d98a', // Starting color for the brand gradient, used in backgrounds or borders to reinforce brand identity.
  brandGradientRight: '#ffd52c', // Ending color for the brand gradient, used in backgrounds or borders to reinforce brand identity.
  contentOnboardingComplete: '#FFFFFF', // Text and image color for onboarding completion screen
} as const

const themeColors = {
  ...colors,
  ...(getAppConfig().themes?.default?.colors ?? {}),
} as const

export type ColorValue = (typeof themeColors)[keyof typeof themeColors]

export default themeColors
