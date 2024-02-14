import { BottomSheetView } from '@gorhom/bottom-sheet'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import BottomSheetBase from 'src/components/BottomSheetBase'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { nftCelebrationDisplayed } from 'src/home/actions'
import ConfettiCelebration from 'src/home/celebration/ConfettiCelebration'
import { celebratedNftSelector, showNftCelebrationSelector } from 'src/home/selectors'
import ImageErrorIcon from 'src/icons/ImageErrorIcon'
import NftMedia from 'src/nfts/NftMedia'
import { nftsWithMetadataSelector } from 'src/nfts/selectors'
import { NftOrigin } from 'src/nfts/types'
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

  const [showConfetti, setShowConfetti] = useState(false)
  const confettiStartTime = useRef(0)

  const canShowNftCelebration = useSelector(showNftCelebrationSelector)
  const celebratedNft = useSelector(celebratedNftSelector)

  const nfts = useSelector(nftsWithMetadataSelector)
  const matchingNft = useMemo(
    () =>
      nfts.find(
        (nft) =>
          !!celebratedNft &&
          !!celebratedNft.networkId &&
          celebratedNft.networkId === nft.networkId &&
          !!celebratedNft.contractAddress &&
          celebratedNft.contractAddress === nft.contractAddress
      ),
    [celebratedNft]
  )

  const isVisible = canShowNftCelebration && matchingNft

  useEffect(() => {
    if (isVisible) {
      // Wait for the home screen to have less ongoing async tasks.
      // This should help the bottom sheet animation run smoothly.
      const timeoutId = setTimeout(() => {
        bottomSheetRef.current?.expand()
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [isVisible])

  const handleBottomSheetPositionChange = (index: number) => {
    if (!matchingNft) {
      return // this should never happen
    }

    if (index === -1) {
      ValoraAnalytics.track(HomeEvents.nft_celebration_displayed, {
        networkId: matchingNft.networkId,
        contractAddress: matchingNft.contractAddress,
      })

      vibrateSuccess()

      confettiStartTime.current = Date.now()
      setShowConfetti(true)
    }
  }

  const handleCtaPress = () => {
    bottomSheetRef.current?.close()
  }

  const handleConfettiFinish = () => {
    finishCelebration({ userInterrupted: false })
  }

  const handleConfettiDismiss = () => {
    finishCelebration({ userInterrupted: true })
  }

  const finishCelebration = ({ userInterrupted }: { userInterrupted: boolean }) => {
    if (!matchingNft) {
      return // this should never happen
    }

    ValoraAnalytics.track(HomeEvents.nft_celebration_animation_displayed, {
      userInterrupted,
      durationInSeconds: Math.round((Date.now() - confettiStartTime.current) / 1000),
    })

    setShowConfetti(false)

    dispatch(nftCelebrationDisplayed())
  }

  if (!isVisible) {
    return null
  }

  return (
    <>
      <BottomSheetBase
        forwardedRef={bottomSheetRef}
        handleComponent={() => null} // handle is rendered within the content body
        backgroundStyle={styles.bottomSheetBackground}
        onChange={handleBottomSheetPositionChange}
      >
        <BottomSheetView style={insetsStyle}>
          <View style={styles.handleWithImage}>
            {matchingNft && (
              <NftMedia
                shouldAutoScaleHeight
                nft={matchingNft}
                ErrorComponent={
                  <View style={styles.imageError}>
                    <ImageErrorIcon />
                  </View>
                }
                origin={NftOrigin.NftCelebration}
                mediaType="image"
                testID="NftMedia"
              />
            )}
            <View style={styles.handleBar} />
          </View>
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
      </BottomSheetBase>
      <ConfettiCelebration
        showAnimation={showConfetti}
        title={t('nftCelebration.notification.title')}
        description={t('nftCelebration.notification.description', {
          rewardName: matchingNft.metadata.name,
        })}
        onAnimationFinish={handleConfettiFinish}
        onDismiss={handleConfettiDismiss}
      />
    </>
  )
}

const IMAGE_BORDER_RADIUS = 20

const styles = StyleSheet.create({
  bottomSheetBackground: {
    marginTop: IMAGE_BORDER_RADIUS, // to not interfere with image rounded corners
    borderRadius: 0,
  },
  content: {
    marginTop: Spacing.Thick24,
    marginHorizontal: Spacing.Thick24,
  },
  handleWithImage: {
    justifyContent: 'center',
    borderTopLeftRadius: IMAGE_BORDER_RADIUS,
    borderTopRightRadius: IMAGE_BORDER_RADIUS,
    aspectRatio: 1.45,
    overflow: 'hidden',
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
    marginHorizontal: Spacing.Regular16,
    marginBottom: Spacing.Smallest8,
  },
})
