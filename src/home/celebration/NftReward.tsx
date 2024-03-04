import { BottomSheetView } from '@gorhom/bottom-sheet'
import { isPast, isToday } from 'date-fns'
import differenceInDays from 'date-fns/differenceInDays'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { openDeepLink } from 'src/app/actions'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import BottomSheetBase from 'src/components/BottomSheetBase'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { nftRewardDisplayed } from 'src/home/actions'
import {
  celebratedNftSelector,
  nftCelebrationSelector,
  showNftRewardSelector,
} from 'src/home/selectors'
import i18n from 'src/i18n'
import { nftsWithMetadataSelector } from 'src/nfts/selectors'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { formatDistanceToNow } from 'src/utils/time'

export default function NftRewardBottomSheet() {
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const canShowNftReward = useSelector(showNftRewardSelector)
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

  const insets = useSafeAreaInsets()
  const insetsStyle = { paddingBottom: Math.max(insets.bottom, Spacing.Regular16) }

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const nftCelebration = useSelector(nftCelebrationSelector)
  const expirationDate = new Date(nftCelebration?.expirationDate ?? 0)
  const reminderDate = new Date(nftCelebration?.reminderDate ?? 0)
  const deepLink = nftCelebration?.deepLink ?? ''

  const { expirationStatus, expirationLabelText } = useExpirationStatus(
    expirationDate,
    reminderDate
  )

  const isVisible = canShowNftReward && matchingNft

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
    if (!celebratedNft) {
      return // This should never happen
    }

    if (index === -1) {
      ValoraAnalytics.track(HomeEvents.nft_reward_dismiss, {
        networkId: celebratedNft.networkId,
        contractAddress: celebratedNft.contractAddress,
        remainingDays: differenceInDays(expirationDate, Date.now()),
      })

      dispatch(nftRewardDisplayed())
    }
  }

  const handleCtaPress = () => {
    if (!celebratedNft) {
      return // This should never happen
    }

    ValoraAnalytics.track(HomeEvents.nft_reward_accept, {
      networkId: celebratedNft.networkId,
      contractAddress: celebratedNft.contractAddress,
      remainingDays: differenceInDays(expirationDate, Date.now()),
    })

    bottomSheetRef.current?.close()

    const isSecureOrigin = true
    dispatch(openDeepLink(deepLink, isSecureOrigin))
  }

  const pillLabel =
    expirationStatus === ExpirationStatus.expired
      ? t('nftCelebration.rewardBottomSheet.expired')
      : t('nftCelebration.rewardBottomSheet.expirationLabel', { expirationLabelText })

  if (!isVisible) {
    return null
  }

  return (
    <BottomSheetBase forwardedRef={bottomSheetRef} onChange={handleBottomSheetPositionChange}>
      <BottomSheetView style={[styles.container, insetsStyle]}>
        <ExpirationPill status={expirationStatus} label={pillLabel} />
        <Text style={styles.title}>{t('nftCelebration.rewardBottomSheet.title')}</Text>
        <Text style={styles.desctiption}>
          {t('nftCelebration.rewardBottomSheet.description', {
            nftName: matchingNft.metadata.name,
          })}
        </Text>
        <Button
          style={styles.button}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
          disabled={expirationStatus === ExpirationStatus.expired}
          onPress={handleCtaPress}
          text={t('nftCelebration.rewardBottomSheet.cta')}
        />
      </BottomSheetView>
    </BottomSheetBase>
  )
}

enum ExpirationStatus {
  active = 'active',
  aboutToExpire = 'aboutToExpire',
  expired = 'expired',
}

// recalculates expiration status every second
const useExpirationStatus = (expirationDate: Date, reminderDate: Date) => {
  const UPDATE_INTERVAL = 1000

  const timeoutID = useRef<number>()

  useEffect(() => {
    updateExpirationStatus()
    return () => clearTimeout(timeoutID.current)
  }, [])

  const getExpirationLabelText = () =>
    formatDistanceToNow(new Date(expirationDate), i18n, { addSuffix: true })

  const [{ expirationLabelText, expirationStatus }, setExpirationStatus] = useState<{
    expirationLabelText: string
    expirationStatus: ExpirationStatus
  }>({ expirationLabelText: getExpirationLabelText(), expirationStatus: ExpirationStatus.active })

  const updateExpirationStatus = () => {
    const expired = isPast(expirationDate)
    const aboutToExpire = isToday(reminderDate) || isPast(reminderDate)

    setExpirationStatus({
      expirationLabelText: getExpirationLabelText(),
      expirationStatus: expired
        ? ExpirationStatus.expired
        : aboutToExpire
          ? ExpirationStatus.aboutToExpire
          : ExpirationStatus.active,
    })
    timeoutID.current = setTimeout(updateExpirationStatus, UPDATE_INTERVAL)
  }

  return { expirationStatus, expirationLabelText }
}

type ExpirationPillProps = { status: ExpirationStatus; label: string }

const ExpirationPill = ({ status, label }: ExpirationPillProps) => (
  <View style={styles.pillContainer}>
    <View style={[styles.pill, expirationPillStyles[status].pill]} testID="NftReward/Pill">
      <Text
        style={[styles.pillLabel, expirationPillStyles[status].label]}
        testID="NftReward/PillLabel"
      >
        {label}
      </Text>
    </View>
  </View>
)

const expirationPillStyles = {
  [ExpirationStatus.active]: {
    pill: { backgroundColor: Colors.gray1 },
    label: { color: Colors.black },
  },
  [ExpirationStatus.aboutToExpire]: {
    pill: { backgroundColor: Colors.warningLight },
    label: { color: Colors.warningDark },
  },
  [ExpirationStatus.expired]: {
    pill: { backgroundColor: Colors.errorLight },
    label: { color: Colors.errorDark },
  },
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.Smallest8,
    marginHorizontal: Spacing.Thick24,
  },

  title: {
    ...typeScale.titleSmall,
  },
  desctiption: {
    marginTop: Spacing.Regular16,
    ...typeScale.bodySmall,
    color: Colors.gray3,
  },
  button: {
    marginTop: Spacing.XLarge48,
  },
  pillContainer: {
    flexDirection: 'row',
  },
  pill: {
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
