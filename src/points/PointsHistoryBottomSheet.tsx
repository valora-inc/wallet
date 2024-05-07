import GorhomBottomSheet, { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ListRenderItem, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { PointsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheetBase from 'src/components/BottomSheetBase'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { NotificationVariant } from 'src/components/InLineNotification'
import SectionHead from 'src/components/SectionHead'
import Toast from 'src/components/Toast'
import { default as Attention, default as AttentionIcon } from 'src/icons/Attention'
import LogoHeart from 'src/icons/LogoHeart'
import { HistoryCardMetadata, useGetHistoryDefinition } from 'src/points/cardDefinitions'
import {
  nextPageUrlSelector,
  pointsHistorySelector,
  pointsHistoryStatusSelector,
} from 'src/points/selectors'
import { getHistoryStarted } from 'src/points/slice'
import { ClaimHistoryCardItem } from 'src/points/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { default as Colors, default as colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { groupFeedItemsInSections } from 'src/transactions/utils'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
}

function PointsHistoryCard({
  icon,
  title,
  subtitle,
  pointsAmount,
  testID,
}: HistoryCardMetadata & { testID?: string }) {
  return (
    <View style={styles.historyCard} testID={testID}>
      <View style={styles.cardIcon}>{icon}</View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.cardPointsAmountContainer}>
        <Text style={styles.cardPointsAmount}>+{pointsAmount}</Text>
        <LogoHeart size={20} />
      </View>
    </View>
  )
}

function PointsHistoryBottomSheet({ forwardedRef }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsHistoryStatus = useSelector(pointsHistoryStatusSelector)
  const pointsHistory = useSelector(pointsHistorySelector)
  const hasNextPage = useSelector(nextPageUrlSelector)

  const getHistoryDefinition = useGetHistoryDefinition()

  const insets = useSafeAreaInsets()

  const onFetchMoreHistory = () => {
    if (!hasNextPage || pointsHistoryStatus !== 'idle') {
      // prevent fetching more history if there is no next page. onEndReached
      // will continue to fire if this is not checked. onEndReached also does
      // not have a throttle so prevent fetching more history when there is
      // already a request in flight.
      return
    }

    ValoraAnalytics.track(PointsEvents.points_screen_activity_fetch_more)
    dispatch(
      getHistoryStarted({
        getNextPage: true,
      })
    )
  }

  const renderItem: ListRenderItem<ClaimHistoryCardItem> = ({ item }) => {
    const historyDefinition = getHistoryDefinition(item)
    if (!historyDefinition) {
      return null
    }
    return (
      <PointsHistoryCard {...historyDefinition} testID={`${item.activityId}-${item.timestamp}`} />
    )
  }

  const onPressTryAgain = (getNextPage: boolean) => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_try_again_press, {
      getNextPage,
    })
    dispatch(
      getHistoryStarted({
        getNextPage,
      })
    )
  }

  const onPressLearnMore = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_learn_more_press)
    forwardedRef.current?.close()
  }

  const Loading =
    pointsHistoryStatus === 'loading' ? (
      <ActivityIndicator
        testID={'PointsHistoryBottomSheet/Loading'}
        style={styles.loadingIcon}
        size="large"
        color={colors.primary}
      />
    ) : null

  const EmptyOrError =
    pointsHistoryStatus === 'errorFirstPage' ? (
      <View testID={'PointsHistoryBottomSheet/Error'} style={styles.emptyContainer}>
        <View style={styles.messageContainer}>
          <Attention size={48} color={Colors.black} />
          <Text style={styles.messageTitle}>{t('points.history.error.title')}</Text>
          <Text style={styles.messageSubtitle}>{t('points.history.error.subtitle')}</Text>
        </View>
        <Button
          testID={'PointsHistoryBottomSheet/TryAgain'}
          onPress={() => onPressTryAgain(false)}
          text={t('points.history.error.tryAgain')}
          type={BtnTypes.GRAY_WITH_BORDER}
          size={BtnSizes.FULL}
          style={{ width: '100%' }}
        />
      </View>
    ) : (
      <View testID={'PointsHistoryBottomSheet/Empty'} style={styles.emptyContainer}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>{t('points.history.empty.title')}</Text>
          <Text style={styles.messageSubtitle}>{t('points.history.empty.subtitle')}</Text>
        </View>
        <Button
          testID={'PointsHistoryBottomSheet/GotIt'}
          onPress={onPressLearnMore}
          text={t('points.history.empty.gotIt')}
          type={BtnTypes.GRAY_WITH_BORDER}
          size={BtnSizes.FULL}
          style={{ width: '100%' }}
        />
      </View>
    )

  const isEmpty = pointsHistoryStatus !== 'loading' && !pointsHistory.length

  const sections = useMemo(() => {
    return groupFeedItemsInSections([], pointsHistory)
  }, [pointsHistory, pointsHistoryStatus])

  return (
    <BottomSheetBase snapPoints={['80%']} forwardedRef={forwardedRef}>
      {!isEmpty && <Text style={styles.contentHeader}>{t('points.history.title')}</Text>}
      <BottomSheetSectionList
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, Spacing.Thick24),
          flex: isEmpty ? 1 : 0,
        }}
        renderItem={renderItem}
        renderSectionHeader={(item) => (
          <SectionHead text={item.section.title} style={styles.sectionHead} />
        )}
        sections={sections}
        keyExtractor={(item) => `${item.activityId}-${item.timestamp}`}
        keyboardShouldPersistTaps="always"
        testID="PointsHistoryList"
        onEndReached={onFetchMoreHistory}
        ListFooterComponent={Loading}
        ListEmptyComponent={isEmpty ? EmptyOrError : null}
        onEndReachedThreshold={0.2}
        stickySectionHeadersEnabled={false}
      />
      <Toast
        showToast={pointsHistoryStatus === 'errorNextPage'}
        variant={NotificationVariant.Error}
        title={t('points.history.pageError.title')}
        description={t('points.history.pageError.subtitle')}
        ctaLabel={t('points.history.pageError.refresh')}
        onPressCta={() => onPressTryAgain(true)}
        style={styles.errorNotification}
        customIcon={<AttentionIcon color={colors.errorDark} size={20} />}
        testID={'PointsHistoryBottomSheet/ErrorBanner'}
      />
    </BottomSheetBase>
  )
}

const styles = StyleSheet.create({
  errorNotification: {
    marginHorizontal: Spacing.Regular16,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.Thick24,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageTitle: {
    ...typeScale.labelSemiBoldLarge,
    paddingVertical: Spacing.Regular16,
  },
  messageSubtitle: {
    ...typeScale.bodySmall,
    textAlign: 'center',
  },
  loadingIcon: {
    marginVertical: Spacing.Thick24,
  },
  contentHeader: {
    ...typeScale.titleSmall,
    padding: Spacing.Thick24,
  },
  sectionHead: {
    paddingHorizontal: Spacing.Thick24,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.Regular16,
    paddingHorizontal: Spacing.Thick24,
  },
  cardIcon: {
    backgroundColor: colors.successLight,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 20,
    width: 40,
    height: 40,
    padding: Spacing.Smallest8,
    marginRight: Spacing.Regular16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    ...typeScale.labelMedium,
  },
  cardSubtitle: {
    ...typeScale.labelSmall,
    color: colors.gray4,
  },
  cardPointsAmount: {
    ...typeScale.labelMedium,
    color: colors.successDark,
  },
  cardPointsAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
})
export default PointsHistoryBottomSheet
