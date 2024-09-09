import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { JumpstartEvents } from 'src/analytics/Events'
import { type AddAssetsAction } from 'src/components/AddAssetsBottomSheet'
import { CICOFlow, FiatExchangeFlow } from 'src/fiatExchanges/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { isAppSwapsEnabledSelector } from 'src/navigator/selectors'
import { TokenActionName } from 'src/tokens/types'
import networkConfig from 'src/web3/networkConfig'

export function useAddAssetsActions(): AddAssetsAction[] {
  const { t } = useTranslation()
  const isSwapEnabled = useSelector(isAppSwapsEnabledSelector)

  return [
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
}
