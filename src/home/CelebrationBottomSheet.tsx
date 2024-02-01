import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import LottieView from 'lottie-react-native'
import React, { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native'
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
import { nftsWithMetadataSelector } from 'src/nfts/selectors'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const CONFETTI_DURATION = 6000 // 6 seconds

const title = 'Multi-chain early adopter 🎁'
const description =
  'As a thank you for being a multi-chain beta tester, we’ve added a free gift to your Valora wallet! The early adopter NFT can be found in your collectibles.'
const imageUrl = 'https://bakoush.in/valora/unsplash_xyVIi4GN5Os.png'
const contractAddress = '0xTEST'
const rewardName = 'Awesome NFT'

function CelebrationBottomSheet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [showNotification, setShowNotification] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const confettiRef = useRef<LottieView>(null)
  const fadeAnim = useSharedValue(1)
  const animatedStyles = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
    }
  })
  const bottomSheetRef = useRef<BottomSheetRefType>(null)
  const nft = useSelector(nftsWithMetadataSelector).find(
    (nft) => nft.contractAddress === contractAddress
  )

  //TODO: remove
  const [show, setShow] = useState(true)
  // if (show) {
  //   bottomSheetRef.current?.snapToIndex(0)
  // }

  console.log('---', { showNotification })

  // TODO: get from state
  const nftCelebrationHasBeenSeen = false

  if (!nft && nftCelebrationHasBeenSeen) {
    return null
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  const renderHandleWithImage = useCallback(
    () => (
      <View style={styles.handle}>
        <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.handleBar} />
      </View>
    ),
    []
  )

  const handleClose = () => {
    console.log('--- close')
    // TODO
    // ValoraAnalytics.track(SwapEvents.swap_add_funds)
    // navigateToFiatCurrencySelection(FiatExchangeFlow.CashIn)
    // TODO: distpatch NFT has been seen

    //bottomSheetRef.current?.snapToIndex(-1)
    setShow(false)
    setShowNotification(true)
    setShowConfetti(true)
    confettiRef.current?.play(0)
    setTimeout(() => {
      setShowNotification(false)
      // fadeAnim.value = withTiming(0, { duration: 300 })
    }, CONFETTI_DURATION)
  }

  const handleAnimationFinish = () => {
    setShowNotification(false)
    setShowConfetti(false)
  }

  const handleDismissAnimation = () => {
    // setShowNotification(false)
    fadeAnim.value = withTiming(0, { duration: 100 }, () => runOnJS(handleAnimationFinish)())
  }

  return (
    <>
      {showConfetti && (
        <TouchableWithoutFeedback onPress={handleDismissAnimation}>
          <Animated.View style={[styles.lottie, animatedStyles]}>
            <LottieView
              ref={confettiRef}
              source={require('./confetti3.json')}
              autoPlay={false}
              loop={false}
              style={[styles.lottie]}
              resizeMode="cover"
              onAnimationFinish={handleAnimationFinish}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
      )}
      <BottomSheetInLineNotification
        showNotification={showNotification}
        severity={Severity.Informational}
        title={t('celebrationBottomSheet.inlineNotification.title')}
        description={t('celebrationBottomSheet.inlineNotification.description', { rewardName })}
        position="top"
        showIcon={false}
      />
      {show && (
        <GorhomBottomSheet
          ref={bottomSheetRef}
          // index={-1}
          enableDynamicSizing
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          handleComponent={renderHandleWithImage}
          backgroundStyle={styles.bottomSheetBackground}
          onClose={handleClose}
        >
          <BottomSheetView style={styles.container}>
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>
            <Button
              type={BtnTypes.PRIMARY}
              size={BtnSizes.FULL}
              style={styles.button}
              onPress={() => {
                bottomSheetRef.current?.close()
              }}
              text={t('celebrationBottomSheet.cta')}
            />
          </BottomSheetView>
        </GorhomBottomSheet>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    marginTop: 20, // to not interfere with image rounded corners
    borderRadius: 0,
  },
  container: {
    padding: Spacing.Regular16,
  },
  content: {
    marginTop: Spacing.Smallest8,
    marginHorizontal: Spacing.Smallest8,
  },
  handle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  image: {
    aspectRatio: 1.45,
    backgroundColor: Colors.successLight,
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
  lottie: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    // pointerEvents: 'none',
  },
})

export default CelebrationBottomSheet
