import React, { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View, ListRenderItem } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import GorhomBottomSheet from '@gorhom/bottom-sheet'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { pointsHistoryStatusSelector, pointsHistorySelector } from 'src/points/selectors'
import { useTranslation } from 'react-i18next'
import { typeScale } from 'src/styles/fonts'
import BottomSheetBase from 'src/components/BottomSheetBase'
import { Spacing } from 'src/styles/styles'
import Attention from 'src/icons/Attention'
import Colors from 'src/styles/colors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import { getHistoryStarted } from 'src/points/slice'
import { ClaimHistoryCardItem } from 'src/points/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import colors from 'src/styles/colors'
import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { useGetHistoryDefinition } from 'src/points/cardDefinitions'
import { HistoryCardMetadata } from 'src/points/cardDefinitions'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
      </View>
    </View>
  )
}

function PointsHistoryBottomSheet({ forwardedRef }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsHistoryStatus = useSelector(pointsHistoryStatusSelector)
  const pointsHistory = useSelector(pointsHistorySelector)

  const getHistoryDefinition = useGetHistoryDefinition()

  const insets = useSafeAreaInsets()

  const onFetchMoreHistory = () => {
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

  const onPressTryAgain = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_try_again_press)
    dispatch(
      getHistoryStarted({
        getNextPage: false,
      })
    )
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
    pointsHistoryStatus === 'error' ? (
      <View testID={'PointsHistoryBottomSheet/Error'} style={styles.errorContainer}>
        <View style={styles.messageContainer}>
          <Attention size={48} color={Colors.black} />
          <Text style={styles.messageTitle}>{t('points.history.error.title')}</Text>
          <Text style={styles.messageSubtitle}>{t('points.history.error.subtitle')}</Text>
        </View>
        <Button
          testID={'PointsHistoryBottomSheet/TryAgain'}
          onPress={onPressTryAgain}
          text={t('points.history.error.tryAgain')}
          type={BtnTypes.GRAY_WITH_BORDER}
          size={BtnSizes.FULL}
          style={{ width: '100%' }}
        />
      </View>
    ) : (
      <View testID={'PointsHistoryBottomSheet/Empty'}></View>
    ) // TODO: Render empty/no history state

  // TODO: Figure out what to render when error occurs on subsequent page fetch

  const sections = useMemo(() => {
    return groupFeedItemsInSections([], pointsHistory)
  }, [pointsHistory, pointsHistoryStatus])

  return (
    <BottomSheetBase snapPoints={['80%']} forwardedRef={forwardedRef}>
      {pointsHistoryStatus !== 'error' && (
        <Text style={styles.contentHeader}>{t('points.history.title')}</Text>
      )}
      <BottomSheetSectionList
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Spacing.Thick24) }}
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
        ListEmptyComponent={EmptyOrError}
        onEndReachedThreshold={0.5}
      />
    </BottomSheetBase>
  )
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
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
    color: colors.primary,
  },
  cardPointsAmountContainer: {
    justifyContent: 'center',
  },
})
export default PointsHistoryBottomSheet
