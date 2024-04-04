import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import GorhomBottomSheet from '@gorhom/bottom-sheet'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { getPointsHistoryStatusSelector } from 'src/points/selectors'
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
import { getInitialHistoryStarted } from 'src/points/slice'

const TAG = 'Points/PointsHistoryBottomSheet'

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
}

function PointsHistoryBottomSheet({ forwardedRef }: Props) {
  const { t } = useTranslation()

  const dispatch = useDispatch()

  const pointsHistoryStatus = useSelector(getPointsHistoryStatusSelector)

  const onPressTryAgain = () => {
    ValoraAnalytics.track(PointsEvents.points_screen_activity_try_again_press)
    dispatch(getInitialHistoryStarted())
  }

  const renderLoading = () => {
    return (
      <View testID={'PointsHistoryBottomSheet/LoadingState'} style={styles.messageContainer}>
        <Text style={styles.messageTitle}>{t('points.history.loading.title')}</Text>
        <Text style={styles.messageSubtitle}>{t('points.history.loading.subtitle')}</Text>
      </View>
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

  // TODO: Render points history, implement fetching more data
  const renderHistory = () => {
    return <View testID={'PointsHistoryBottomSheet/MainContent'}></View>
  }

  const renderContents = () => {
    switch (pointsHistoryStatus) {
      case 'idle':
      case 'loading-more': {
        return renderHistory()
      }
      case 'loading-initial': {
        return renderLoading()
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
})
export default PointsHistoryBottomSheet
