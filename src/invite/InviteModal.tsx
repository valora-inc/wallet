import * as React from 'react'
import { Trans } from 'react-i18next'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  title: string
  description?: string
  descriptionKey?: string
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
  descriptionKey,
  buttonLabel,
  disabled,
  imageSource,
  helpLink,
  onClose,
  onShareInvite,
}: Props) => {
  const onPressHelp = () => {
    if (helpLink) {
      ValoraAnalytics.track(InviteEvents.invite_help_link)
      navigate(Screens.WebViewScreen, { uri: helpLink })
    }
  }

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={[fontStyles.h2, styles.text]}>{title}</Text>
        {description ? <Text style={[fontStyles.regular, styles.text]}>{description}</Text> : null}
        {descriptionKey ? (
          <Text style={[fontStyles.regular, styles.text]}>
            <Trans i18nKey={descriptionKey}>
              <Text style={styles.textBold} />
            </Trans>
          </Text>
        ) : null}
        <Button
          testID="InviteModalShareButton"
          icon={<ShareIcon color={colors.light} height={24} />}
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
    height: variables.height,
    width: variables.width,
    flexGrow: 1,
    position: 'absolute',
    backgroundColor: colors.light,
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
    marginBottom: Spacing.Large32,
  },
  helpText: {
    ...fontStyles.xsmall,
    color: colors.gray5,
    textAlign: 'center',
  },
  helpLink: {
    color: colors.onboardingBlue,
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
