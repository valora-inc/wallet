import BottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { DAPPS_LEARN_MORE } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const useDappInfoBottomSheet = () => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const paddingBottom = Math.max(insets.bottom, Spacing.Thick24)

  const bottomSheetRef = useRef<BottomSheet>(null)

  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], [])
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(initialSnapPoints)

  const onPressMore = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open_more_info)
    navigate(Screens.WebViewScreen, { uri: DAPPS_LEARN_MORE })
  }

  const openSheet = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open_info)
    bottomSheetRef.current?.snapToIndex(0)
  }

  const renderBackdrop = useCallback(
    (props) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  const DappInfoBottomSheet = useMemo(
    () => (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handle}
      >
        <View style={[styles.container, { paddingBottom }]} onLayout={handleContentLayout}>
          <Text style={styles.title}>{t('dappsScreenInfoSheet.title')}</Text>
          <Text style={styles.description}>{t('dappsScreenInfoSheet.description')}</Text>
          <Button
            text={t('dappsScreenInfoSheet.buttonLabel')}
            onPress={onPressMore}
            size={BtnSizes.FULL}
            type={BtnTypes.SECONDARY}
            testID="DAppsExplorerScreen/InfoBottomSheet/PrimaryAction"
          />
        </View>
      </BottomSheet>
    ),
    [animatedSnapPoints, animatedHandleHeight, animatedContentHeight, handleContentLayout]
  )

  return {
    openSheet,
    DappInfoBottomSheet,
  }
}

const styles = StyleSheet.create({
  handle: {
    backgroundColor: Colors.gray3,
  },
  container: {
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: Spacing.Regular16,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  description: {
    ...fontStyles.small,
    marginBottom: Spacing.Large32,
  },
})

export default useDappInfoBottomSheet
