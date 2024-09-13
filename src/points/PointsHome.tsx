import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import BackButton from 'src/components/BackButton'
import BeatingHeartLoader from 'src/components/BeatingHeartLoader'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import NumberTicker from 'src/components/NumberTicker'
import Toast from 'src/components/Toast'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import AttentionIcon from 'src/icons/Attention'
import LogoHeart from 'src/images/LogoHeart'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import ActivityCardSection from 'src/points/ActivityCardSection'
import PointsHistoryBottomSheet from 'src/points/PointsHistoryBottomSheet'
import {
  pointsActivitiesSelector,
  pointsBalanceSelector,
  pointsBalanceStatusSelector,
  pointsConfigStatusSelector,
  pointsHistoryStatusSelector,
} from 'src/points/selectors'
import { getPointsConfigRetry, pointsDataRefreshStarted } from 'src/points/slice'
import { BottomSheetParams, PointsActivityId } from 'src/points/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = NativeStackScreenProps<StackParamList, Screens.PointsHome>

export default function PointsHome({ route, navigation }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsActivities = useSelector(pointsActivitiesSelector)
  const pointsConfigStatus = useSelector(pointsConfigStatusSelector)
  const pointsBalance = useSelector(pointsBalanceSelector)
  const pointsBalanceStatus = useSelector(pointsBalanceStatusSelector)
  const pointsHistoryStatus = useSelector(pointsHistoryStatusSelector)

  const historyBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const activityCardBottomSheetRef = useRef<BottomSheetModalRefType>(null)
  const disclaimerBottomSheetRef = useRef<BottomSheetModalRefType>(null)

  const [bottomSheetParams, setBottomSheetParams] = useState<BottomSheetParams | undefined>(
    undefined
  )
  useEffect(() => {
    if (bottomSheetParams) {
      activityCardBottomSheetRef.current?.snapToIndex(0)
    }
  }, [bottomSheetParams])

  useEffect(() => {
    onRefreshHistoryAndBalance()
  }, [])

  const onRefreshHistoryAndBalance = () => {
    dispatch(pointsDataRefreshStarted())
  }

  const onCardPress = (bottomSheetDetails: BottomSheetParams) => {
    setBottomSheetParams(bottomSheetDetails)
  }

  const onCtaPressWrapper = (onPress: () => void, activityId: PointsActivityId) => {
    return () => {
      AppAnalytics.track(PointsEvents.points_screen_card_cta_press, {
        activityId,
      })
      onPress()
    }
  }

  const onPressActivity = () => {
    AppAnalytics.track(PointsEvents.points_screen_activity_press)
    historyBottomSheetRef.current?.snapToIndex(0)
  }

  const onRetryLoadConfig = () => {
    dispatch(getPointsConfigRetry())
  }

  const onPressDisclaimer = () => {
    AppAnalytics.track(PointsEvents.points_screen_disclaimer_press)
    disclaimerBottomSheetRef.current?.snapToIndex(0)
  }

  return (
    <SafeAreaView style={styles.outerContainer} edges={['top']}>
      <CustomHeader
        style={styles.header}
        left={<BackButton eventName={PointsEvents.points_screen_back} />}
      />
      <ScrollView
        testID={'PointsScrollView'}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            refreshing={pointsBalanceStatus === 'loading'}
            onRefresh={onRefreshHistoryAndBalance}
          />
        }
      >
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
              type={BtnTypes.SECONDARY}
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
                type={BtnTypes.SECONDARY}
                size={BtnSizes.FULL}
                touchableStyle={styles.buttonStyle}
              />
            </View>
            <View style={styles.balanceRow}>
              <NumberTicker
                testID="PointsBalance"
                value={pointsBalance}
                disableAnimation={pointsBalanceStatus === 'loading'}
              />
              <LogoHeart size={28} />
            </View>

            {pointsActivities.length > 0 ? (
              <>
                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>{t('points.infoCard.title')}</Text>
                  <Text style={styles.infoCardBody}>{t('points.infoCard.body')}</Text>
                </View>

                <ActivityCardSection
                  pointsActivities={pointsActivities}
                  onCardPress={onCardPress}
                />
              </>
            ) : (
              <InLineNotification
                variant={NotificationVariant.Info}
                hideIcon={true}
                title={t('points.noActivities.title')}
                description={t('points.noActivities.body')}
              />
            )}

            <Touchable onPress={onPressDisclaimer}>
              <Text style={styles.disclaimerText}>
                <Trans i18nKey="points.disclaimer.learnMoreCta">
                  <Text style={styles.disclaimerLink} />
                </Trans>
              </Text>
            </Touchable>
          </>
        )}
      </ScrollView>
      <Toast
        showToast={pointsBalanceStatus === 'error' || pointsHistoryStatus === 'errorFirstPage'}
        variant={NotificationVariant.Warning}
        title={t('points.fetchBalanceError.title')}
        description={t('points.fetchBalanceError.description')}
        ctaLabel={t('points.fetchBalanceError.retryCta')}
        onPressCta={onRefreshHistoryAndBalance}
      />
      <PointsHistoryBottomSheet forwardedRef={historyBottomSheetRef} />
      <BottomSheet forwardedRef={activityCardBottomSheetRef} testId={`PointsActivityBottomSheet`}>
        {bottomSheetParams && (
          <>
            <View style={styles.bottomSheetPointAmountContainer}>
              <Text style={styles.bottomSheetPreviousPointsAmount}>
                {bottomSheetParams.previousPointsAmount}
              </Text>
              <Text style={styles.bottomSheetPointAmount}>{bottomSheetParams.pointsAmount}</Text>
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
                  bottomSheetParams.activityId
                )}
                text={bottomSheetParams.cta.text}
              />
            )}
          </>
        )}
      </BottomSheet>
      <BottomSheet
        title={t('points.disclaimer.title')}
        titleStyle={typeScale.labelSemiBoldMedium}
        forwardedRef={disclaimerBottomSheetRef}
        testId={`DisclaimerBottomSheet`}
      >
        <Text style={typeScale.bodySmall}>{t('points.disclaimer.body')}</Text>
        <Button
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          onPress={() => {
            disclaimerBottomSheetRef.current?.close()
          }}
          text={t('points.disclaimer.dismiss')}
          style={styles.disclaimerCloseButton}
        />
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
  bottomSheetPreviousPointsAmount: {
    ...typeScale.labelSemiBoldXSmall,
    color: Colors.gray3,
    textDecorationLine: 'line-through',
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
  disclaimerText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
    textAlign: 'center',
    marginVertical: Spacing.Thick24,
  },
  disclaimerLink: {
    ...typeScale.labelSmall,
    textDecorationLine: 'underline',
  },
  disclaimerCloseButton: {
    marginTop: Spacing.XLarge48,
  },
})
