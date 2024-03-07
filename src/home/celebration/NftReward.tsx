import { BottomSheetView } from '@gorhom/bottom-sheet'
import differenceInDays from 'date-fns/differenceInDays'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openDeepLink } from 'src/app/actions'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import BottomSheetBase from 'src/components/BottomSheetBase'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { nftRewardDisplayed } from 'src/home/actions'
import { isSameNftContract } from 'src/home/celebration/utils'
import { NftCelebrationStatus } from 'src/home/reducers'
import { nftCelebrationSelector } from 'src/home/selectors'
import i18n from 'src/i18n'
import { nftsWithMetadataSelector } from 'src/nfts/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { formatDistanceToNow } from 'src/utils/time'

export default function NftRewardBottomSheet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [rewardAccepted, setRewardAccepted] = useState(false)

  const nftCelebration = useSelector(nftCelebrationSelector)

  const nfts = useSelector(nftsWithMetadataSelector)
  const matchingNft = useMemo(
    () => nfts.find((nft) => isSameNftContract(nft, nftCelebration)),
    [nftCelebration]
  )

  const isVisible = !!matchingNft

  const insets = useSafeAreaInsets()
  const insetsStyle = { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) }

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const isReminder = nftCelebration?.status === NftCelebrationStatus.reminderReadyToDisplay

  const rewardExpirationDate = new Date(nftCelebration?.rewardExpirationDate ?? 0)
  const expirationLabelText = formatDistanceToNow(rewardExpirationDate, i18n, { addSuffix: true })

  const { pillStyle, labelStyle } = isReminder
    ? {
        pillStyle: { backgroundColor: Colors.warningLight },
        labelStyle: { color: Colors.warningDark },
      }
    : {
        pillStyle: { backgroundColor: Colors.gray1 },
        labelStyle: { color: Colors.black },
      }

  const copyText = isReminder ? 'rewardReminderBottomSheet' : 'rewardBottomSheet'

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
    if (!nftCelebration) {
      return // This should never happen
    }

    if (index === -1) {
      if (!rewardAccepted) {
        ValoraAnalytics.track(HomeEvents.nft_reward_dismiss, {
          networkId: nftCelebration.networkId,
          contractAddress: nftCelebration.contractAddress,
          remainingDays: differenceInDays(rewardExpirationDate, Date.now()),
        })
      }

      dispatch(nftRewardDisplayed())
    }
  }

  const handleCtaPress = () => {
    if (!nftCelebration) {
      return // This should never happen
    }

    ValoraAnalytics.track(HomeEvents.nft_reward_accept, {
      networkId: nftCelebration.networkId,
      contractAddress: nftCelebration.contractAddress,
      remainingDays: differenceInDays(rewardExpirationDate, Date.now()),
    })

    setRewardAccepted(true)

    bottomSheetRef.current?.close()

    if (nftCelebration?.deepLink) {
      const isSecureOrigin = true
      dispatch(openDeepLink(nftCelebration.deepLink, isSecureOrigin))
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <BottomSheetBase forwardedRef={bottomSheetRef} onChange={handleBottomSheetPositionChange}>
      <BottomSheetView style={[styles.container, insetsStyle]}>
        <View style={[styles.pill, pillStyle]} testID="NftReward/Pill">
          <Text style={[styles.pillLabel, labelStyle]} testID="NftReward/PillLabel">
            {t(`nftCelebration.${copyText}.expirationLabel`, { expirationLabelText })}
          </Text>
        </View>
        <Text style={styles.title}>{t(`nftCelebration.${copyText}.title`)}</Text>
        <Text style={styles.description}>
          {t(`nftCelebration.${copyText}.description`, {
            nftName: matchingNft.metadata.name,
          })}
        </Text>
        <Button
          style={styles.button}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          onPress={handleCtaPress}
          text={t(`nftCelebration.${copyText}.cta`)}
        />
      </BottomSheetView>
    </BottomSheetBase>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
  },
  title: {
    ...typeScale.titleSmall,
  },
  description: {
    marginTop: Spacing.Regular16,
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  button: {
    marginTop: Spacing.XLarge48,
  },
  pill: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.Regular16,
    ...typeScale.labelSemiBoldXSmall,
    paddingHorizontal: Spacing.Small12,
    paddingVertical: Spacing.Smallest8,
    borderRadius: 1000,
  },
  pillLabel: {
    ...typeScale.labelSemiBoldXSmall,
  },
})
