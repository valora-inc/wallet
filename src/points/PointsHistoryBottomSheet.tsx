import React, { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View, ListRenderItem } from 'react-native'
import SectionHead from 'src/components/SectionHead'
import GorhomBottomSheet from '@gorhom/bottom-sheet'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { pointsHistoryStatusSelector, pointsHistorySelector } from 'src/points/selectors'
import { useTranslation } from 'react-i18next'
import { typeScale } from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import BottomSheetBase from 'src/components/BottomSheetBase'
import { Spacing } from 'src/styles/styles'
import Attention from 'src/icons/Attention'
import Colors from 'src/styles/colors'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'
import { getHistoryStarted } from 'src/points/slice'
import { ClaimHistory, HistoryCardMetadata } from 'src/points/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import colors from 'src/styles/colors'
import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { useGetHistoryDefinition } from 'src/points/cardDefinitions'

jest.mock('src/statsig', () => ({
  getDynamicConfigParams: jest.fn().mockReturnValue({
    showSwap: ['celo-alfajores'],
  }),
}))

const TAG = 'Points/PointsHistoryBottomSheet'

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

  const onPressTryAgain = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_try_again_press)
    dispatch(
      getHistoryStarted({
        getNextPage: false,
      })
    )
  }

  const fetchMoreHistory = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_fetch_more)
    dispatch(
      getHistoryStarted({
        getNextPage: true,
      })
    )
  }

  const renderError = () => {
    return (
      <View testID={'PointsHistoryBottomSheet/ErrorState'} style={styles.errorContainer}>
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
    )
  }

  const sections = useMemo(() => {
    if (!pointsHistory.length) {
      return []
    }
    return groupFeedItemsInSections([], pointsHistory, (t: ClaimHistory) => Date.parse(t.createdAt))
  }, [pointsHistory])

  const renderItem: ListRenderItem<ClaimHistory> = ({ item }: { item: ClaimHistory }) => {
    try {
      const historyDefinition = getHistoryDefinition(item)
      return (
        <PointsHistoryCard {...historyDefinition} testID={`${item.activityId}-${item.createdAt}`} />
      )
    } catch (error) {
      Logger.error(TAG, 'Error encountered while trying to render history card, skipping', error)
      return <></>
    }
  }

  const renderHistory = () => {
    return (
      <View testID={'PointsHistoryBottomSheet/MainContent'} style={styles.contentContainer}>
        <Text style={styles.contentHeader}>{t('points.history.title')}</Text>
        <BottomSheetSectionList
          renderItem={renderItem}
          renderSectionHeader={(item) => (
            <SectionHead text={item.section.title} style={styles.sectionHead} />
          )}
          sections={sections}
          keyExtractor={(item) => `${item.activityId}-${item.createdAt}`}
          keyboardShouldPersistTaps="always"
          testID="PointsHistoryList"
          onEndReached={fetchMoreHistory}
        />
        {pointsHistoryStatus === 'loading' && (
          <View style={styles.centerContainer}>
            <ActivityIndicator
              testID={'PointsHistoryBottomSheet/Loading'}
              style={styles.loadingIcon}
              size="large"
              color={colors.primary}
            />
          </View>
        )}
      </View>
    )
  }

  const renderContents = () => {
    switch (pointsHistoryStatus) {
      case 'idle':
      case 'loading': {
        return renderHistory()
      }
      case 'error': {
        return renderError()
      }
      default: {
        Logger.error(TAG, `Unknown points history status found: ${pointsHistoryStatus}`)
      }
    }
  }

  return (
    <BottomSheetBase snapPoints={['80%']} forwardedRef={forwardedRef}>
      <View style={styles.container}>{renderContents()}</View>
    </BottomSheetBase>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.Thick24,
  },
  contentContainer: {
    justifyContent: 'flex-end',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  loadingIcon: {
    marginVertical: Spacing.Thick24,
    height: 108,
    width: 108,
  },
  contentHeader: {
    ...typeScale.titleSmall,
    paddingBottom: Spacing.Thick24,
  },
  sectionHead: {
    paddingHorizontal: 0,
  },
  historyCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.Regular16,
  },
  cardIcon: {
    backgroundColor: colors.successLight,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    width: 40,
    height: 40,
    padding: Spacing.Smallest8,
    marginRight: Spacing.Regular16,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'column',
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
