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
import { BottomSheetRefType } from 'src/components/BottomSheet'
import BottomSheetInLineNotification from 'src/components/BottomSheetInLineNotification'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { Severity } from 'src/components/InLineNotification'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import { nftsWithMetadataSelector } from 'src/nfts/selectors'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const NOTIFICATION_DURATION = 6000 // 6 seconds

// const imageUrl = 'https://bakoush.in/valora/unsplash_xyVIi4GN5Os.png'
const contractAddress = '0x376f5039df4e9e9c864185d8fabad4f04a7e394a'

export default function NftCelebrationBottomSheet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const bottomSheetRef = useRef<BottomSheetRefType>(null)
  const [showBottomSheet, setShowBottomSheet] = useState(true)

  const [showNotification, setShowNotification] = useState(false)
  useEffect(() => {
    if (showNotification) {
      const timeoutId = setTimeout(() => setShowNotification(false), NOTIFICATION_DURATION)
      return () => clearTimeout(timeoutId)
    }
  }, [showNotification])

  const confettiRef = useRef<LottieView>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettyOpacity = useSharedValue(1)
  const confettyOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: confettyOpacity.value,
    }
  })

  const nft = useSelector(nftsWithMetadataSelector).find(
    (nft) => nft.contractAddress === contractAddress
  )

  // TODO: get from state
  const hasBeenSeen = false

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

  if (!nft || hasBeenSeen) {
    return null
  }

  const handleClose = () => {
    // TODO
    // ValoraAnalytics.track(SwapEvents.swap_add_funds)
    // navigateToFiatCurrencySelection(FiatExchangeFlow.CashIn)
    // TODO: distpatch NFT has been seen

    setShowBottomSheet(false)
    setShowNotification(true)
    setShowConfetti(true)
    confettiRef.current?.play(0)
  }

  const handleAnimationFinish = () => {
    setShowNotification(false)
    setShowConfetti(false)
  }

  const handleDismissAnimation = () => {
    confettyOpacity.value = withTiming(0, { duration: 100 }, () => runOnJS(handleAnimationFinish)())
  }

  const rewardName = nft?.metadata?.name ?? t('celebrationBottomSheet.inlineNotification.nft')

  return (
    <>
      <BottomSheetInLineNotification
        showNotification={showNotification}
        severity={Severity.Informational}
        title={t('celebrationBottomSheet.inlineNotification.title')}
        description={t('celebrationBottomSheet.inlineNotification.description', { rewardName })}
        position="top"
        showIcon={false}
      />
      {showConfetti && (
        <TouchableWithoutFeedback onPress={handleDismissAnimation}>
          <Animated.View style={[styles.confettiAnimation, confettyOpacityStyle]}>
            <LottieView
              ref={confettiRef}
              source={require('./confetti3.json')}
              autoPlay={false}
              loop={false}
              style={[styles.confettiAnimation]}
              resizeMode="cover"
              onAnimationFinish={handleAnimationFinish}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
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
  confettiAnimation: {
    ...StyleSheet.absoluteFillObject,
  },
})
