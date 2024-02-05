import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import LottieView from 'lottie-react-native'
import React, { useCallback, useRef, useState } from 'react'
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
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import { nftsWithMetadataSelector } from 'src/nfts/selectors'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { DynamicConfigs } from 'src/statsig/constants'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Network } from 'src/transactions/types'
import confettiAnimation from './confettiAnimation.json'

const ANIMATION_DURATION = 6000 // 6 seconds

// const imageUrl = 'https://bakoush.in/valora/unsplash_xyVIi4GN5Os.png'

export default function NftCelebrationBottomSheet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const bottomSheetRef = useRef<BottomSheetRefType>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(true)

  const [showAnimation, setShowAnimation] = useState(false)

  const confettiOpacity = useSharedValue(1)
  const confettiOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: confettiOpacity.value,
    }
  })
  const animationStartTime = useRef(0)

  const nftContractAddress =
    getDynamicConfigParams(DynamicConfigs[StatsigDynamicConfigs.NFT_CELEBRATION_CONFIG])?.[
      Network.Celo
    ]?.nftContractAddress ?? '0x376f5039df4e9e9c864185d8fabad4f04a7e394a' // TODO: remove

  const nft = useSelector(nftsWithMetadataSelector).find(
    (nft) => nft.contractAddress === nftContractAddress
  )

  const showCelebration = getFeatureGate(StatsigFeatureGates.SHOW_NFT_CELEBRATION) || true // TODO: remove

  const celebrationHasBeenDisplayed = false // TODO: remove
  //  nftContractAddress === useSelector(lastDisplayedNftCelebration)

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
        <FastImage
          style={styles.image}
          source={{ uri: nft?.metadata?.image }}
          resizeMode={FastImage.resizeMode.cover}
          onError={() => setShowError(true)}
        />
        {showError && (
          <View style={styles.imageError}>
            <ImageErrorIcon />
          </View>
        )}
        <View style={styles.handleBar} />
      </View>
    )
  }, [nft])

  if (!nftContractAddress || !nft || !showCelebration || celebrationHasBeenDisplayed) {
    return null
  }

  const handleClose = () => {
    ValoraAnalytics.track(HomeEvents.nft_celebration_displayed, { nftContractAddress })

    setShowBottomSheet(false)

    animationStartTime.current = Date.now()
    setShowAnimation(true)
  }

  const handleAnimationFinish = ({ userInterrupted = false } = {}) => {
    const durationInSeconds = Math.round((Date.now() - animationStartTime.current) / 1000)
    ValoraAnalytics.track(HomeEvents.nft_celebration_animation_displayed, {
      userInterrupted,
      durationInSeconds,
    })

    setShowAnimation(false)
    dispatch(nftCelebrationDisplayed(nftContractAddress))
  }

  const handleDismissAnimation = () => {
    confettiOpacity.value = withTiming(0, { duration: 100 }, () =>
      runOnJS(handleAnimationFinish)({ userInterrupted: true })
    )
  }

  const rewardName = nft?.metadata?.name ?? t('celebrationBottomSheet.inlineNotification.nft')

  return (
    <>
      {showBottomSheet && (
        <GorhomBottomSheet
          ref={bottomSheetRef}
          enableDynamicSizing
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleComponent={renderHandleWithImage}
          backgroundStyle={styles.bottomSheetBackground}
          onClose={handleClose}
        >
          <BottomSheetView style={styles.container}>
            <View style={styles.content}>
              <Text style={styles.title}>{t('celebrationBottomSheet.title')}</Text>
              <Text style={styles.description}>{t('celebrationBottomSheet.description')}</Text>
            </View>
            <Button
              style={styles.button}
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              onPress={() => bottomSheetRef.current?.close()}
              text={t('celebrationBottomSheet.cta')}
            />
          </BottomSheetView>
        </GorhomBottomSheet>
      )}
      {showAnimation && (
        <Animated.View style={[styles.fullScreen, confettiOpacityStyle]}>
          <LottieView
            autoPlay
            duration={ANIMATION_DURATION}
            loop={false}
            source={confettiAnimation}
            style={[styles.fullScreen]}
            resizeMode="cover"
            onAnimationFinish={() => handleAnimationFinish()}
          />
        </Animated.View>
      )}
      <BottomSheetInLineNotification
        showNotification={showAnimation}
        severity={Severity.Informational}
        title={t('celebrationBottomSheet.inlineNotification.title')}
        description={t('celebrationBottomSheet.inlineNotification.description', { rewardName })}
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
