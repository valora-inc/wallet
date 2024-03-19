import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useMemo, useRef, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, Text, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import QRCode from 'react-native-qrcode-svg'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { JumpstartEvents } from 'src/analytics/Events'
import { JumpstartShareOrigin } from 'src/analytics/Properties'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes } from 'src/components/Button'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import Dialog from 'src/components/Dialog'
import CustomHeader from 'src/components/header/CustomHeader'
import QRCodeIcon from 'src/icons/QRCode'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { noHeaderGestureDisabled } from 'src/navigator/Headers'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import useBackHandler from 'src/utils/useBackHandler'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartShareLink>

const TAG = 'JumpstartShareLink'

function JumpstartShareLink({ route }: Props) {
  const { tokenId, link, sendAmount } = route.params

  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const qrCodeBottomSheetRef = useRef<BottomSheetRefType>(null)

  const shouldNavigate = useRef(false)
  const [showNavigationWarning, setShowNavigationWarning] = useState(false)

  const token = useTokenInfo(tokenId)
  const trackedDepositProperties = useMemo(() => {
    return {
      tokenId,
      networkId: token?.networkId || null,
      amountInUsd: new BigNumber(sendAmount).multipliedBy(token?.priceUsd || 0).toString(),
    }
  }, [token, route.params])

  useBackHandler(() => {
    if (!showNavigationWarning) {
      handleShowNavigationWarning()
    }
    return true
  }, [])

  const nativeShare = useAsyncCallback(
    async (origin: JumpstartShareOrigin) => {
      ValoraAnalytics.track(JumpstartEvents.jumpstart_share_link, {
        ...trackedDepositProperties,
        origin,
      })
      qrCodeBottomSheetRef.current?.close()
      const result = await Share.share({
        message: t('jumpstartShareLinkScreen.shareMessage', {
          link,
          tokenAmount: sendAmount,
          tokenSymbol: token?.symbol,
        }),
      })
      return result
    },
    {
      onSuccess: (result) => {
        ValoraAnalytics.track(JumpstartEvents.jumpstart_share_link_result, {
          ...result,
          ...trackedDepositProperties,
        })
      },
      onError: (error) => {
        ValoraAnalytics.track(JumpstartEvents.jumpstart_share_link_result, {
          ...trackedDepositProperties,
          error: ensureError(error).message,
        })
      },
    }
  )

  const handleShowNavigationWarning = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_share_close)
    setShowNavigationWarning(true)
  }

  const handleConfirmNavigation = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_share_confirm_close)
    // calling navigateHome directly from this function causes an app crash,
    // possibly because of the race condition between navigation and unmounting
    // the Dialog (Modal). Using a ref to track the user's intention to navigate
    // as a quick fix here, as we plan to remove the use of the Dialog soon.
    setShowNavigationWarning(false)
    shouldNavigate.current = true
  }

  const handleDismissNavigationWarning = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_share_dismiss_close)
    setShowNavigationWarning(false)
  }

  const handleNavigation = () => {
    if (shouldNavigate.current) {
      navigateHome()
    }
  }

  const handleShowQRBottomSheet = () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_show_QR, trackedDepositProperties)
    qrCodeBottomSheetRef.current?.snapToIndex(0)
  }

  const handleCopyLink = (origin: JumpstartShareOrigin) => () => {
    ValoraAnalytics.track(JumpstartEvents.jumpstart_copy_link, {
      ...trackedDepositProperties,
      origin,
    })
  }

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeAreaContainer}>
      <CustomHeader
        style={styles.customHeader}
        left={
          <TopBarIconButton
            icon={<Times />}
            onPress={handleShowNavigationWarning}
            testID="JumpstartShareLink/CloseButton"
          />
        }
      />
      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, Spacing.Thick24) },
        ]}
        testID="JumpstartShareLink/ScrollView"
      >
        <Text style={styles.title}>{t('jumpstartShareLinkScreen.title')}</Text>
        <Text style={styles.description}>
          {t('jumpstartShareLinkScreen.description', { tokenSymbol: token.symbol })}
        </Text>
        <DataFieldWithCopy
          label={t('jumpstartShareLinkScreen.linkLabel')}
          value={link}
          copySuccessMessage={t('jumpstartShareLinkScreen.linkCopiedMessage')}
          testID="JumpstartShareLink/LiveLink"
          onCopy={handleCopyLink(JumpstartShareOrigin.MainScreen)}
          style={styles.copyContainer}
        />
        <View style={styles.buttonsContainer}>
          <Button
            text={t('jumpstartShareLinkScreen.ctaShare')}
            onPress={() => nativeShare.execute(JumpstartShareOrigin.MainScreen)}
            style={styles.button}
            icon={<ShareIcon color={Colors.white} />}
            iconPositionLeft={false}
            size={BtnSizes.FULL}
          />
          <Button
            text={t('jumpstartShareLinkScreen.ctaScanQRCode')}
            onPress={handleShowQRBottomSheet}
            style={styles.button}
            icon={<QRCodeIcon color={Colors.white} />}
            iconPositionLeft={false}
            size={BtnSizes.FULL}
          />
        </View>
        <Dialog
          title={t('jumpstartShareLinkScreen.navigationWarning.title')}
          isVisible={showNavigationWarning}
          actionText={t('jumpstartShareLinkScreen.ctaShare')}
          actionPress={handleDismissNavigationWarning}
          testID="JumpstartShareLink/ConfirmNavigationDialog"
          secondaryActionText={t('jumpstartShareLinkScreen.navigationWarning.ctaNavigate')}
          secondaryActionPress={handleConfirmNavigation}
          onDialogHide={handleNavigation}
        >
          <Text style={styles.description}>
            {t('jumpstartShareLinkScreen.navigationWarning.description')}
          </Text>
        </Dialog>
      </ScrollView>
      <BottomSheet
        forwardedRef={qrCodeBottomSheetRef}
        testId="JumpstartShareLink/QRCodeBottomSheet"
      >
        <View testID="QRCode" style={styles.qrContainer}>
          <QRCode value={link} size={160} />
        </View>
        <Text style={[styles.title, styles.centeredText]}>
          {t('jumpstartShareLinkScreen.qrCodeBottomSheet.title')}
        </Text>
        <Text style={[styles.description, styles.centeredText]}>
          {t('jumpstartShareLinkScreen.qrCodeBottomSheet.description')}
        </Text>
        <DataFieldWithCopy
          label={t('jumpstartShareLinkScreen.linkLabel')}
          value={link}
          copySuccessMessage={t('jumpstartShareLinkScreen.linkCopiedMessage')}
          testID="JumpstartShareLink/QRCodeBottomSheet/LiveLink"
          onCopy={handleCopyLink(JumpstartShareOrigin.QrScreen)}
          style={styles.copyContainer}
        />
        <Button
          text={t('jumpstartShareLinkScreen.ctaShare')}
          onPress={() => nativeShare.execute(JumpstartShareOrigin.QrScreen)}
          style={styles.button}
          icon={<ShareIcon color={Colors.white} />}
          iconPositionLeft={false}
          size={BtnSizes.FULL}
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  customHeader: {
    paddingHorizontal: Spacing.Thick24,
  },
  contentContainer: {
    padding: Spacing.Thick24,
    flexGrow: 1,
  },
  title: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodyMedium,
    marginBottom: Spacing.Large32,
  },
  copyContainer: {
    marginTop: 0,
    marginBottom: Spacing.Regular16,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.Regular16,
  },
  button: {
    flex: 1,
  },
  qrContainer: {
    marginTop: Spacing.Regular16,
    marginBottom: Spacing.Large32,
    alignItems: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
})

JumpstartShareLink.navigationOptions = () => ({
  ...noHeaderGestureDisabled,
})

export default JumpstartShareLink
