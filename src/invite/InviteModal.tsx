import * as React from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { InviteEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import ShareIcon from 'src/icons/Share'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import CustomHeader from 'src/components/header/CustomHeader'
import BackButton from 'src/components/BackButton'

interface Props {
  title: string
  description?: string
  descriptionI18nKey?: string
  contactName?: string
  buttonLabel: string
  disabled: boolean
  helpLink?: string
  onClose(): void
  onShareInvite(): void
}

const InviteModal = ({
  title,
  description,
  descriptionI18nKey,
  contactName,
  buttonLabel,
  disabled,
  helpLink,
  onClose,
  onShareInvite,
}: Props) => {
  const { height, width } = useSafeAreaFrame()

  const onPressHelp = () => {
    if (helpLink) {
      AppAnalytics.track(InviteEvents.invite_help_link)
      navigate(Screens.WebViewScreen, { uri: helpLink })
    }
  }

  return (
    <SafeAreaView testID="InviteModalContainer" style={[styles.container, { height, width }]}>
      <CustomHeader left={<BackButton testID="InviteModalContainer/Back" onPress={onClose} />} />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.subtitle}>{description}</Text> : null}
        {descriptionI18nKey ? (
          <Text style={styles.subtitle} testID="InviteModalStyledDescription">
            <Trans
              i18nKey={descriptionI18nKey}
              tOptions={contactName ? { contactName } : undefined}
            >
              <Text style={styles.textBold} />
            </Trans>
          </Text>
        ) : null}
        <Button
          style={{ width: '100%' }}
          testID="InviteModalShareButton"
          icon={<ShareIcon color={colors.white} size={24} />}
          iconPositionLeft={false}
          size={BtnSizes.FULL}
          text={buttonLabel}
          type={BtnTypes.PRIMARY}
          disabled={disabled}
          onPress={onShareInvite}
        />
      </View>
      {helpLink ? (
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            <Trans i18nKey="inviteWithUrl.help">
              <Text style={styles.helpLink} onPress={onPressHelp} />
            </Trans>
          </Text>
        </View>
      ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: colors.white,
    paddingHorizontal: Spacing.Thick24,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typeScale.titleMedium,
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
  subtitle: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    marginBottom: Spacing.Large32,
    color: colors.gray4,
  },
  helpContainer: {
    marginBottom: Spacing.Regular16,
  },
  helpText: {
    ...typeScale.bodyXSmall,
    color: colors.gray5,
    textAlign: 'center',
  },
  helpLink: {
    color: colors.infoDark,
    flexWrap: 'wrap',
    textDecorationLine: 'underline',
  },
  textBold: {
    ...typeScale.bodyMedium,
    fontFamily: 'Inter-SemiBold',
  },
})

export default InviteModal
