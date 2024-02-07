import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import BottomSheetInLineNotification from 'src/components/BottomSheetInLineNotification'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { Severity } from 'src/components/InLineNotification'
import { nftCelebrationDisplayed } from 'src/home/actions'
import { lastDisplayedNftCelebration } from 'src/home/selectors'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import { nftsLoadingSelector, nftsWithMetadataSelector } from 'src/nfts/selectors'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { vibrateSuccess } from 'src/styles/hapticFeedback'
import { Spacing } from 'src/styles/styles'
import confettiAnimation from './confettiAnimation.json'

const ANIMATION_DURATION = 6000 // 6 seconds

export default function NftCelebration() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const [showAnimation, setShowAnimation] = useState(false)
  const animationStartTime = useRef(0)

  const confettiOpacity = useSharedValue(1)
  const confettiOpacityStyle = useAnimatedStyle(() => ({
    opacity: confettiOpacity.value,
  }))

  const featureGateEnabled = getFeatureGate(StatsigFeatureGates.SHOW_NFT_CELEBRATION)

  const celebratedNft = getDynamicConfigParams(
    DynamicConfigs[StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG]
  )

  const nftsLoading = useSelector(nftsLoadingSelector)
  const nfts = useSelector(nftsWithMetadataSelector)
  const matchedNft = nfts.find(
    (nft) =>
      !!celebratedNft.networkId &&
      celebratedNft.networkId === nft.networkId &&
      !!celebratedNft.contractAddress &&
      celebratedNft.contractAddress === nft.contractAddress
  )

  useEffect(() => {
    if (!nftsLoading) {
      bottomSheetRef.current?.expand()
    }
  }, [nftsLoading])

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

  const renderHandleWithImage = useCallback(() => {
    const [showError, setShowError] = useState(false)
    return (
      <View style={styles.handleWithImage}>
        {matchedNft && (
          <FastImage
            style={styles.image}
            source={{ uri: matchedNft.metadata.image }}
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
  }, [matchedNft])

  if (!featureGateEnabled || !celebratedNft || !matchedNft || celebrationHasBeenDisplayed) {
    return null
  }

  const handleBottomSheetPositionChange = (index: number) => {
    if (index === -1) {
      ValoraAnalytics.track(HomeEvents.nft_celebration_displayed, {
        networkId: matchedNft.networkId,
        contractAddress: matchedNft.contractAddress,
      })

      vibrateSuccess()

      animationStartTime.current = Date.now()
      setShowAnimation(true)
    }
  }

  const handleCtaPress = () => {
    bottomSheetRef.current?.close()
  }

  const handleAnimationFinish = () => {
    celebrationFinish({ userInterrupted: false })
  }

  const handleDismissAnimation = () => {
    confettiOpacity.value = withTiming(0, { duration: 100 }, () =>
      runOnJS(celebrationFinish)({ userInterrupted: true })
    )
  }

  const celebrationFinish = ({ userInterrupted }: { userInterrupted: boolean }) => {
    ValoraAnalytics.track(HomeEvents.nft_celebration_animation_displayed, {
      userInterrupted,
      durationInSeconds: Math.round((Date.now() - animationStartTime.current) / 1000),
    })

    setShowAnimation(false)
    dispatch(
      nftCelebrationDisplayed({
        networkId: matchedNft.networkId,
        contractAddress: matchedNft.contractAddress,
      })
    )
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
        <BottomSheetView style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.title}>{t('nftCelebration.bottomSheet.title')}</Text>
            <Text style={styles.description}>{t('nftCelebration.bottomSheet.description')}</Text>
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
      {showAnimation && (
        <Animated.View style={[styles.fullScreen, confettiOpacityStyle]}>
          <LottieView
            autoPlay
            duration={ANIMATION_DURATION}
            loop={false}
            source={confettiAnimation}
            style={[styles.fullScreen]}
            resizeMode="cover"
            onAnimationFinish={handleAnimationFinish}
          />
        </Animated.View>
      )}
      <BottomSheetInLineNotification
        showNotification={showAnimation}
        severity={Severity.Informational}
        title={t('nftCelebration.inlineNotification.title')}
        description={t('nftCelebration.inlineNotification.description', {
          rewardName: matchedNft.metadata.name,
        })}
        position="top"
        showIcon={false}
      />
      {showAnimation && (
        <TouchableWithoutFeedback onPress={handleDismissAnimation}>
          <View style={styles.fullScreen} />
        </TouchableWithoutFeedback>
      )}
    </>
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
  fullScreen: {
    ...StyleSheet.absoluteFillObject,
  },
})
