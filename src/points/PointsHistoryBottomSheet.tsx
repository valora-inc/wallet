import React, { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
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
import { ClaimHistory } from 'src/points/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import colors from 'src/styles/colors'
import { BottomSheetSectionList } from '@gorhom/bottom-sheet'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
}

function PointsHistoryBottomSheet({ forwardedRef }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsHistoryStatus = useSelector(pointsHistoryStatusSelector)
  const pointsHistory = useSelector(pointsHistorySelector)

  const onPressTryAgain = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_try_again_press)
    dispatch(
      getHistoryStarted({
        getNextPage: false,
      })
    )
  }

  const onFetchMoreHistory = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_fetch_more)
    dispatch(
      getHistoryStarted({
        getNextPage: true,
      })
    )
  }

  const sections = useMemo(() => {
    if (!pointsHistory.length || pointsHistoryStatus === 'error') {
      return []
    }
    return groupFeedItemsInSections([], pointsHistory, (t: ClaimHistory) => Date.parse(t.createdAt))
  }, [pointsHistory, pointsHistoryStatus])

  // TODO: Render items
  const renderItem = () => {
    return <></>
  }

  const renderLoading = () => {
    if (pointsHistoryStatus !== 'loading') {
      return <></>
    }
    return (
      <ActivityIndicator
        testID={'PointsHistoryBottomSheet/Loading'}
        style={styles.loadingIcon}
        size="large"
        color={colors.primary}
      />
    )
  }

  const renderEmpty = () => {
    if (pointsHistoryStatus === 'error') {
      return (
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
      )
    }

    // TODO: Render empty/no history state
    return <View testID={'PointsHistoryBottomSheet/Empty'}></View>
  }

  return (
    <BottomSheetBase snapPoints={['80%']} forwardedRef={forwardedRef}>
      <View style={styles.container}>
        {pointsHistoryStatus !== 'error' && (
          <Text style={styles.contentHeader}>{t('points.history.title')}</Text>
        )}
        <BottomSheetSectionList
          contentContainerStyle={styles.contentContainer}
          renderItem={renderItem}
          renderSectionHeader={(item) => (
            <SectionHead text={item.section.title} style={styles.sectionHead} />
          )}
          sections={sections}
          keyExtractor={(item) => `${item.activityId}-${item.createdAt}`}
          keyboardShouldPersistTaps="always"
          testID="PointsHistoryList"
          onEndReached={onFetchMoreHistory}
          ListFooterComponent={renderLoading}
          ListEmptyComponent={renderEmpty}
        />
      </View>
    </BottomSheetBase>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.Thick24,
  },
  contentContainer: {
    flex: 1,
  },
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
    paddingBottom: Spacing.Thick24,
  },
  sectionHead: {
    paddingHorizontal: 0,
  },
})
export default PointsHistoryBottomSheet
