import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents } from 'src/analytics/Events'
import AddAssetsBottomSheet, { AddAssetsAction } from 'src/components/AddAssetsBottomSheet'
import { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { CICOFlow, FiatExchangeFlow } from 'src/fiatExchanges/utils'
import JumpstartIntro from 'src/jumpstart/JumpstartIntro'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { useSelector } from 'src/redux/hooks'
import { TokenActionName } from 'src/tokens/types'
import networkConfig from 'src/web3/networkConfig'

export default function JumpstartAddAssets() {
  const addAssetsBottomSheetRef = useRef<BottomSheetRefType>(null)

  const { t } = useTranslation()

  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)

  const handleShowAddFunds = () => {
    AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_show_actions)
    addAssetsBottomSheetRef.current?.snapToIndex(0)
  }

  const addAssetsActions: AddAssetsAction[] = [
    {
      name: TokenActionName.Add,
      details: t('jumpstartIntro.addFundsCelo.actionDescriptions.add'),
      onPress: () => {
        AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_action_press, {
          action: TokenActionName.Add,
        })
        navigate(Screens.FiatExchangeCurrencyBottomSheet, {
          flow: FiatExchangeFlow.CashIn,
          networkId: networkConfig.defaultNetworkId,
        })
      },
    },
    {
      name: TokenActionName.Transfer,
      details: t('jumpstartIntro.addFundsCelo.actionDescriptions.transfer'),
      onPress: () => {
        AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_action_press, {
          action: TokenActionName.Transfer,
        })
        navigate(Screens.ExchangeQR, {
          flow: CICOFlow.CashIn,
        })
      },
    },
    ...(isSwapEnabled
      ? [
          {
            name: TokenActionName.Swap as const,
            details: t('jumpstartIntro.addFundsCelo.actionDescriptions.swap'),
            onPress: () => {
              AppAnalytics.track(JumpstartEvents.jumpstart_add_assets_action_press, {
                action: TokenActionName.Swap,
              })
              navigate(Screens.SwapScreenWithBack, {
                toTokenNetworkId: networkConfig.defaultNetworkId,
              })
            },
          },
        ]
      : []),
  ]

  return (
    <JumpstartIntro
      description={[t('jumpstartIntro.infoLine1'), t('jumpstartIntro.infoLine2')]}
      button={
        <Button
          onPress={handleShowAddFunds}
          text={t('jumpstartIntro.addFundsCelo.cta')}
          type={BtnTypes.PRIMARY}
          size={BtnSizes.FULL}
        />
      }
    >
      <AddAssetsBottomSheet
        forwardedRef={addAssetsBottomSheetRef}
        title={t('jumpstartIntro.addFundsCelo.title')}
        description={t('jumpstartIntro.addFundsCelo.description')}
        actions={addAssetsActions}
        testId="Jumpstart/addFundsCeloBottomSheet"
      />
    </JumpstartIntro>
  )
}
