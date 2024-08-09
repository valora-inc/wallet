import * as React from 'react'
import { Trans } from 'react-i18next'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView, useSafeAreaFrame } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { InviteEvents } from 'src/analytics/Events'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  title: string
  description?: string
  descriptionI18nKey?: string
  contactName?: string
  buttonLabel: string
  disabled: boolean
  imageSource: ImageSourcePropType
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
  imageSource,
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
      <Touchable
        onPress={onClose}
        borderless={true}
        hitSlop={variables.iconHitslop}
        testID="InviteModalCloseButton"
      >
        <Times />
      </Touchable>
      <View style={styles.contentContainer}>
        <Image style={styles.imageContainer} source={imageSource} resizeMode="contain" />
        <Text style={[typeScale.titleSmall, styles.text]}>{title}</Text>
        {description ? <Text style={[fontStyles.regular, styles.text]}>{description}</Text> : null}
        {descriptionI18nKey ? (
          <Text style={[fontStyles.regular, styles.text]} testID="InviteModalStyledDescription">
            <Trans
              i18nKey={descriptionI18nKey}
              tOptions={contactName ? { contactName } : undefined}
            >
              <Text style={styles.textBold} />
            </Trans>
          </Text>
        ) : null}
        <Button
          testID="InviteModalShareButton"
          icon={<ShareIcon color={colors.white} height={24} />}
          iconPositionLeft={false}
          size={BtnSizes.SMALL}
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
    flexGrow: 1,
    position: 'absolute',
    backgroundColor: colors.white,
    padding: Spacing.Thick24,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    marginBottom: Spacing.Regular16,
    width: 120,
    height: 120,
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
  text: {
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
  textBold: {
    ...fontStyles.regular,
    fontFamily: 'Inter-SemiBold',
  },
})

export default InviteModal
