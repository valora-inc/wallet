import React, { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard } from 'react-native'
import { DappExplorerEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { DAPPS_LEARN_MORE } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

const useDappInfoBottomSheet = () => {
  const { t } = useTranslation()

  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const onPressMore = () => {
    ValoraAnalytics.track(DappExplorerEvents.dapp_open_more_info)
    navigate(Screens.WebViewScreen, { uri: DAPPS_LEARN_MORE })
  }

  const openSheet = () => {
    // dismiss keyboard if it's open prior to showing bottom sheet
    Keyboard.dismiss()
    ValoraAnalytics.track(DappExplorerEvents.dapp_open_info)
    bottomSheetRef.current?.snapToIndex(0)
  }

  const DappInfoBottomSheet = useMemo(
    () => (
      <BottomSheet
        forwardedRef={bottomSheetRef}
        title={t('dappsScreenInfoSheet.title')}
        description={t('dappsScreenInfoSheet.description')}
        testId="DAppsExplorerScreen/InfoBottomSheet"
      >
        <Button
          text={t('dappsScreenInfoSheet.buttonLabel')}
          onPress={onPressMore}
          size={BtnSizes.FULL}
          type={BtnTypes.SECONDARY}
          testID="DAppsExplorerScreen/InfoBottomSheet/PrimaryAction"
        />
      </BottomSheet>
    ),
    []
  )

  return {
    openSheet,
    DappInfoBottomSheet,
  }
}

export default useDappInfoBottomSheet
