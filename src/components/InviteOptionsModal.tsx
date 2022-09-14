import { getPhoneHash } from '@celo/utils/lib/phoneNumbers'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, Image, Share, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { InviteEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import { DYNAMIC_DOWNLOAD_LINK } from 'src/config'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { inviteModal } from 'src/images/Images'
import { getDisplayName, Recipient } from 'src/recipients/recipient'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

interface Props {
  recipient: Recipient
  onClose(): void
}

const InviteOptionsModal = ({ recipient, onClose }: Props) => {
  const { t } = useTranslation()

  const handleShareInvite = async () => {
    const message = t('inviteModal.shareMessage', {
      link: DYNAMIC_DOWNLOAD_LINK,
    })
    ValoraAnalytics.track(InviteEvents.invite_with_share, {
      phoneNumberHash: recipient.e164PhoneNumber ? getPhoneHash(recipient.e164PhoneNumber) : null,
    })
    await Share.share({ message })
  }

  const handleClose = () => {
    ValoraAnalytics.track(InviteEvents.invite_with_share_dismiss)
    onClose()
  }

  return (
    <SafeAreaView style={styles.container}>
      <Touchable onPress={handleClose} borderless={true} hitSlop={variables.iconHitslop}>
        <Times />
      </Touchable>
      <View style={styles.contentContainer}>
        <Image style={styles.imageContainer} source={inviteModal} resizeMode="contain" />
        <Text style={[fontStyles.h2, styles.text]}>
          {t('inviteModal.title', { contactName: getDisplayName(recipient, t) })}
        </Text>
        <Text style={[fontStyles.regular, styles.text]}>{t('inviteModal.body')}</Text>
        <Button
          icon={<ShareIcon color={colors.light} height={24} />}
          iconPositionLeft={false}
          size={BtnSizes.SMALL}
          text={t('inviteModal.sendInviteButtonLabel')}
          type={BtnTypes.PRIMARY}
          onPress={handleShareInvite}
        />
      </View>
    </SafeAreaView>
  )
}
const { height, width } = Dimensions.get('window')

const styles = StyleSheet.create({
  container: {
    height,
    width,
    flex: 1,
    position: 'absolute',
    bottom: 0,
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
  text: {
    textAlign: 'center',
    marginBottom: Spacing.Regular16,
  },
})

export default InviteOptionsModal
