import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BackButton from 'src/components/BackButton'
import BeatingHeartLoader from 'src/components/BeatingHeartLoader'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import CustomHeader from 'src/components/header/CustomHeader'
import AttentionIcon from 'src/icons/Attention'
import LogoHeart from 'src/icons/LogoHeart'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import ActivityCardSection from 'src/points/ActivityCardSection'
import { pointsConfigStatusSelector, pointsSectionsSelector } from 'src/points/selectors'
import { getHistoryStarted, getPointsConfigRetry } from 'src/points/slice'
import { BottomSheetParams, PointsActivity } from 'src/points/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.PointsHome>

export default function PointsHome({ route, navigation }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsSections = useSelector(pointsSectionsSelector)
  const pointsConfigStatus = useSelector(pointsConfigStatusSelector)

  // TODO: Use real points balance
  const pointsBalance = 50

  const activityCardBottomSheetRef = useRef<BottomSheetRefType>(null)

  const [bottomSheetParams, setBottomSheetParams] = useState<BottomSheetParams | undefined>(
    undefined
  )
  useEffect(() => {
    if (bottomSheetParams) {
      activityCardBottomSheetRef.current?.snapToIndex(0)
    }
  }, [bottomSheetParams])

  useEffect(() => {
    dispatch(getHistoryStarted({ getNextPage: false }))
  }, [])

  const onCardPress = (bottomSheetDetails: BottomSheetParams) => {
    setBottomSheetParams(bottomSheetDetails)
  }

  const onCtaPressWrapper = (onPress: () => void, activity: PointsActivity) => {
    return () => {
      ValoraAnalytics.track(PointsEvents.points_screen_card_cta_press, {
        activity,
      })
      onPress()
    }
  }

  const onPressActivity = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_press)
    // TODO: Open history bottom sheet
  }

  const onRetryLoadConfig = () => {
    dispatch(getPointsConfigRetry())
  }

  return (
    <SafeAreaView style={styles.outerContainer} edges={['top']}>
      <CustomHeader
        style={styles.header}
        left={<BackButton eventName={PointsEvents.points_screen_back} />}
      />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {pointsConfigStatus === 'loading' && (
          <View style={styles.loadingStatusContainer}>
            <BeatingHeartLoader size={64} />
            <Text style={styles.loadingStatusTitle}>{t('points.loading.title')}</Text>
            <Text style={styles.loadingStatusBodyText}>{t('points.loading.description')}</Text>
          </View>
        )}

        {pointsConfigStatus === 'error' && (
          <View style={styles.loadingStatusContainer}>
            <AttentionIcon size={48} color={Colors.black} />
            <Text style={styles.loadingStatusTitle}>{t('points.error.title')}</Text>
            <Text style={styles.loadingStatusBodyText}>{t('points.error.description')}</Text>
            <Button
              onPress={onRetryLoadConfig}
              text={t('points.error.retryCta')}
              type={BtnTypes.GRAY_WITH_BORDER}
              size={BtnSizes.FULL}
              style={styles.loadingRetryButton}
            />
          </View>
        )}

        {pointsConfigStatus === 'success' && (
          <>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{t('points.title')}</Text>
              <Button
                testID={'PointsActivityButton'}
                onPress={onPressActivity}
                text={t('points.activity')}
                type={BtnTypes.GRAY_WITH_BORDER}
                fontStyle={typeScale.labelXSmall}
                size={BtnSizes.FULL}
                touchableStyle={styles.buttonStyle}
              />
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balance}>{pointsBalance}</Text>
              <LogoHeart size={28} />
            </View>

            {pointsSections.length > 0 ? (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>{t('points.infoCard.title')}</Text>
                  <Text style={styles.infoCardBody}>{t('points.infoCard.body')}</Text>
                </View>
                <ActivityCardSection onCardPress={onCardPress} pointsSections={pointsSections} />
              </>
            ) : (
              <InLineNotification
                variant={NotificationVariant.Info}
                hideIcon={true}
                title={t('points.noActivities.title')}
                description={t('points.noActivities.body')}
              />
            )}
          </>
        )}
      </ScrollView>
      <BottomSheet forwardedRef={activityCardBottomSheetRef} testId={`PointsActivityBottomSheet`}>
        {bottomSheetParams && (
          <>
            <View style={styles.bottomSheetPointAmountContainer}>
              <Text style={styles.bottomSheetPointAmount}>{bottomSheetParams.points}</Text>
              <LogoHeart size={16} />
            </View>
            <Text style={styles.bottomSheetTitle}>{bottomSheetParams.title}</Text>
            <Text style={styles.bottomSheetBody}>{bottomSheetParams.body}</Text>
            {bottomSheetParams.cta && (
              <Button
                testID={'PointsHomeBottomSheetCtaButton'}
                type={BtnTypes.PRIMARY}
                size={BtnSizes.FULL}
                onPress={onCtaPressWrapper(
                  bottomSheetParams.cta.onPress,
                  bottomSheetParams.activity
                )}
                text={bottomSheetParams.cta.text}
              />
            )}
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    paddingBottom: Spacing.Thick24,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: Spacing.Thick24,
    paddingTop: 0,
  },
  loadingStatusContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.Regular16,
  },
  loadingStatusTitle: {
    ...typeScale.labelSemiBoldLarge,
    textAlign: 'center',
  },
  loadingStatusBodyText: {
    ...typeScale.bodySmall,
    textAlign: 'center',
  },
  loadingRetryButton: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  header: {
    paddingHorizontal: Spacing.Thick24,
  },
  bottomSheetPointAmountContainer: {
    flexDirection: 'row',
    gap: Spacing.Tiny4,
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    borderRadius: Spacing.XLarge48,
    paddingVertical: Spacing.Smallest8,
    paddingHorizontal: Spacing.Small12,
  },
  bottomSheetPointAmount: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.successDark,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    marginVertical: Spacing.Regular16,
  },
  bottomSheetBody: {
    ...typeScale.bodySmall,
    color: Colors.gray3,
    marginBottom: Spacing.XLarge48,
  },
  balanceRow: {
    paddingBottom: Spacing.Thick24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  balance: {
    ...typeScale.displaySmall,
  },
  infoCard: {
    backgroundColor: Colors.successLight,
    padding: Spacing.Regular16,
    marginBottom: Spacing.Thick24,
    borderRadius: 12,
  },
  infoCardTitle: {
    ...typeScale.labelSemiBoldSmall,
    paddingBottom: Spacing.Smallest8,
  },
  infoCardBody: {
    ...typeScale.bodyXSmall,
  },
  title: {
    ...typeScale.titleMedium,
    paddingVertical: Spacing.Smallest8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonStyle: {
    height: undefined,
    paddingHorizontal: Spacing.Small12,
    paddingVertical: Spacing.Smallest8,
  },
})
