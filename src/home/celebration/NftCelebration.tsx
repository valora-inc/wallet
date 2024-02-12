import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { APP_NAME } from 'src/brandingConfig'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { nftCelebrationDisplayed } from 'src/home/actions'
import ConfettiCelebration from 'src/home/celebration/ConfettiCelebration'
import { lastDisplayedNftCelebration } from 'src/home/selectors'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import { nftsLoadingSelector, nftsWithMetadataSelector } from 'src/nfts/selectors'
import { NftWithMetadata } from 'src/nfts/types'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'

export default function NftCelebration() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const insets = useSafeAreaInsets()
  const insetsStyle = { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) }

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const [showConfettiCelebration, setShowConfettiCelebration] = useState(false)
  const confettiCelebrationStartTime = useRef(0)

  const [nftsLoaded, setNftsLoaded] = useState(false)

  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_CELEBRATION)

  const celebratedNft = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG]
  )

  const nftsLoading = useSelector(nftsLoadingSelector)
  useEffect(() => {
    // ensure we wait until NFTs are loaded only once
    if (!nftsLoading && !nftsLoaded) {
      setNftsLoaded(true)
    }
  }, [nftsLoading])

  const nfts = useSelector(nftsWithMetadataSelector)
  const matchedNft = nfts.find(
    (nft) =>
      !!celebratedNft &&
      !!celebratedNft.networkId &&
      celebratedNft.networkId === nft.networkId &&
      !!celebratedNft.contractAddress &&
      celebratedNft.contractAddress === nft.contractAddress
  )

  const lastDisplayedCelebration = useSelector(lastDisplayedNftCelebration)
  const celebrationHasBeenDisplayed =
    !!lastDisplayedCelebration &&
    !!celebratedNft &&
    lastDisplayedCelebration.networkId === celebratedNft.networkId &&
    lastDisplayedCelebration.contractAddress === celebratedNft.contractAddress

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  const renderHandleWithImage = useCallback(
    () => <HandleWithImage nft={matchedNft} />,
    [matchedNft]
  )

  const isVisible = featureGateEnabled && matchedNft && nftsLoaded && !celebrationHasBeenDisplayed

  useEffect(() => {
    if (isVisible) {
      const timeoutId = setTimeout(() => {
        bottomSheetRef.current?.expand()
      }, 1000 /* delay to ensure the bottom sheet is layed out */)
      return () => clearTimeout(timeoutId)
    }
  }, [isVisible])

  const handleBottomSheetPositionChange = (index: number) => {
    if (!matchedNft) {
      return // this should never happen
    }

    if (index === -1) {
      ValoraAnalytics.track(HomeEvents.nft_celebration_displayed, {
        networkId: matchedNft.networkId,
        contractAddress: matchedNft.contractAddress,
      })

      vibrateSuccess()

      confettiCelebrationStartTime.current = Date.now()
      setShowConfettiCelebration(true)
    }
  }

  const handleCtaPress = () => {
    bottomSheetRef.current?.close()
  }

  const handleConfettiCelebrationFinish = () => {
    finishCelebration({ userInterrupted: false })
  }

  const handleConfettiCelebrationDismiss = () => {
    finishCelebration({ userInterrupted: true })
  }

  const finishCelebration = ({ userInterrupted }: { userInterrupted: boolean }) => {
    if (!matchedNft) {
      return // this should never happen
    }

    ValoraAnalytics.track(HomeEvents.nft_celebration_animation_displayed, {
      userInterrupted,
      durationInSeconds: Math.round((Date.now() - confettiCelebrationStartTime.current) / 1000),
    })

    setShowConfettiCelebration(false)

    dispatch(
      nftCelebrationDisplayed({
        networkId: matchedNft.networkId,
        contractAddress: matchedNft.contractAddress,
      })
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      <GorhomBottomSheet
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        index={-1}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandleWithImage}
        backgroundStyle={styles.bottomSheetBackground}
        onChange={handleBottomSheetPositionChange}
      >
        <BottomSheetView style={[styles.container, insetsStyle]}>
          <View style={styles.content}>
            <Text style={styles.title}>{t('nftCelebration.bottomSheet.title')}</Text>
            <Text style={styles.description}>
              {t('nftCelebration.bottomSheet.description', { appName: APP_NAME })}
            </Text>
          </View>
          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.FULL}
            onPress={handleCtaPress}
            text={t('nftCelebration.bottomSheet.cta')}
          />
        </BottomSheetView>
      </GorhomBottomSheet>
      <ConfettiCelebration
        showAnimation={showConfettiCelebration}
        title={t('nftCelebration.notification.title')}
        description={t('nftCelebration.notification.description', {
          rewardName: matchedNft.metadata.name,
          appName: APP_NAME,
        })}
        onAnimationFinish={handleConfettiCelebrationFinish}
        onDismiss={handleConfettiCelebrationDismiss}
      />
    </>
  )
}

const HandleWithImage = ({ nft }: { nft?: NftWithMetadata }) => {
  const [showError, setShowError] = useState(false)
  return (
    <View style={styles.handleWithImage}>
      {nft && (
        <FastImage
          style={styles.image}
          source={{ uri: nft.metadata.image }}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => setShowError(true)}
        />
      )}
      {showError && (
        <View style={styles.imageError}>
          <ImageErrorIcon />
        </View>
      )}
      <View style={styles.handleBar} />
    </View>
  )
}

const IMAGE_BORDER_RADIUS = 20

const styles = StyleSheet.create({
  bottomSheetBackground: {
    marginTop: IMAGE_BORDER_RADIUS, // to not interfere with image rounded corners
    borderRadius: 0,
  },
  container: {
    padding: Spacing.Regular16,
  },
  content: {
    marginTop: Spacing.Smallest8,
    marginHorizontal: Spacing.Smallest8,
  },
  handleWithImage: {
    borderTopLeftRadius: IMAGE_BORDER_RADIUS,
    borderTopRightRadius: IMAGE_BORDER_RADIUS,
    overflow: 'hidden',
  },
  image: {
    aspectRatio: 1.45,
    backgroundColor: Colors.successLight,
  },
  imageError: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleBar: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 4,
    borderRadius: 4,
    backgroundColor: '#D8D8D8',
  },
  title: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
    marginTop: Spacing.Smallest8,
  },
  button: {
    marginTop: Spacing.XLarge48,
    marginBottom: Spacing.Regular16,
  },
})
