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
import { groupFeedItemsInSections } from 'src/transactions/utils'
import colors from 'src/styles/colors'
import { BottomSheetSectionList } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
}

function PointsHistoryBottomSheet({ forwardedRef }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsHistoryStatus = useSelector(pointsHistoryStatusSelector)
  const pointsHistory = useSelector(pointsHistorySelector)

  const insets = useSafeAreaInsets()

  const onFetchMoreHistory = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_fetch_more)
    dispatch(
      getHistoryStarted({
        getNextPage: true,
      })
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

  // TODO: Render items
  const renderItem = () => {
    return <></>
  }

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
})
export default PointsHistoryBottomSheet
