// Designer Created Figma Colors
// from https://www.figma.com/design/erFfzHvSTm5g1sjK6jWyEH/Working-Design-System?node-id=2100-4881&node-type=frame&t=vKGGXrs3Torz7kFE-0
enum Colors {
  // backgrounds
  backgroundPrimary = '#FFFFFF', // Main background color for the app, used for primary surfaces (screens, navigation).
  backgroundInverse = '#2E3338', // High-contrast background color for the app.
  backgroundSecondary = '#F8F9F9', // Subtle contrast background for secondary surfaces like cards, panels, or inputs.
  backgroundTertiary = '#E6E6E6', // Low-emphasis background for subtle supporting areas, typically used when both primary and secondary backgrounds are present, and an additional layer of distinction is needed.

  // text, icons, and other content
  contentPrimary = '#2E3338', // main content on primary background
  contentSecondary = '#757575', // supporting context on primary background
  contentInverse = '#FFFFFF', // content on inverse backgrounds
  textLink = '#757575', // underlined text links on primary background

  // borders, shadows, highlights, visual effects
  border = '#E6E6E6',
  shadow = '#2E3338', // shadow base color
  softShadow = 'rgba(156, 164, 169, 0.4)',
  lightShadow = 'rgba(48, 46, 37, 0.15)',
  barShadow = 'rgba(129, 134, 139, 0.5)',
  skeletonPlaceholderHighlight = '#FFFFFF', // animated highlight color on skeleton loaders
  skeletonPlaceholderBackground = '#E6E6E6', // background color on skeleton loaders
  loadingIndicator = '#1AB775', // spinner or loading indicator

  // interactive elements
  navigationTopPrimary = '#2E3338', // color for text and icons on top navigation
  navigationTopSecondary = '#757575', // secondary color for text and icons on top navigation
  navigationBottomPrimary = '#2E3338', // color for text and icons on bottom navigation
  navigationBottomSecondary = '#757575', // secondary color for text and icons on bottom navigation
  bottomSheetHandle = '#757575', // color for bottom sheet handle
  buttonPrimary = '#2E3338', // Primary button background, used for high-priority actions.
  buttonSecondary = '#F8F9F9', // Secondary button background, for less emphasized actions or alternative options.
  buttonTertiary = '#FFFFFF', // Tertiary button background, typically used for minimal or low-emphasis actions.

  // statuses and UI feedback colors
  disabled = '#E6E6E6', // Used for disabled elements that are non-interactive or visually de-emphasized.
  inactive = '#757575', // Represents inactive or placeholder elements, often less prominent but still visible.
  info = '#F8F9F9', // Background for neutral or informational states, typically non-critical.
  success = '#137211', // Indicates successful actions or positive states, often used for icons or highlights.
  successSecondary = '#F1FDF1', // Subtle background for success states, such as notifications or banners.
  warning = '#9C6E00', // Highlights warning states, used to draw attention to cautionary information.
  warningSecondary = '#FFF9EA', // Subtle background for warning states, providing gentle emphasis without overpowering.
  error = '#C93717', // Represents error or failure states, used for critical feedback or alerts.
  errorSecondary = '#FBF2F0', // Subtle background for error states, providing softer emphasis in contexts like modals or notifications.

  // brand colors for decorative elements
  accent = '#1AB775', // Accent color for emphasizing key elements, such as highlights, icons, or decorative details.
  brandGradientLeft = '#26d98a', // Starting color for the brand gradient, used in backgrounds or borders to reinforce brand identity.
  brandGradientRight = '#ffd52c', // Ending color for the brand gradient, used in backgrounds or borders to reinforce brand identity.
}

export default Colors
