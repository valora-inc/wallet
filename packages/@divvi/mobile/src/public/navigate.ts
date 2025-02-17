// See useWallet for why we don't directly import internal modules, except for the types
import { ParamListBase } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import type { CICOFlowType, FiatExchangeFlowType } from '../fiatExchanges/types'
import type { Navigate } from '../navigator/NavigationService'
import type { ScreensType } from '../navigator/Screens'
import type { Store } from '../redux/store'
import type { TokensByIdSelector } from '../tokens/selectors'
import type { NetworkId as InternalNetworkId } from '../transactions/types'
import type { LoggerType } from '../utils/Logger'
import type { NetworkConfig } from '../web3/networkConfig'
import type { NetworkId } from './types'

const TAG = 'public/navigate'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace DivviNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface RootParamList extends StackParamList {}
  }
}

export type NavigatorScreen = ReturnType<
  // TODO: this weird looking type works around a type error when checking the lib vs example app
  // Maybe we can get rid of this once we're able to ship declaration files
  typeof createNativeStackNavigator<
    DivviNavigation.RootParamList extends ParamListBase ? DivviNavigation.RootParamList : never
  >
>['Screen']

export type StackParamList = {
  Send: undefined
  Receive: undefined
  Swap:
    | {
        fromTokenId?: string
        toTokenId?: string
        toTokenNetworkId?: NetworkId
      }
    | undefined
  Add:
    | {
        tokenId: string
      }
    | undefined
  Withdraw: undefined
  TabWallet: undefined
  TabActivity: undefined
  TabEarn: undefined
  TabDiscover: undefined
}

export type { NativeStackScreenProps } from '@react-navigation/native-stack'

type NavigateArgs<ParamList = DivviNavigation.RootParamList> = {
  [RouteName in keyof ParamList]: undefined extends ParamList[RouteName]
    ? [RouteName] | [RouteName, ParamList[RouteName]]
    : [RouteName, ParamList[RouteName]]
}[keyof ParamList]

export function navigate(...args: NavigateArgs): void {
  const internalNavigate = require('../navigator/NavigationService').navigate as Navigate
  const Logger = require('../utils/Logger').default as LoggerType
  const store = require('../redux/store').store as Store
  const tokensByIdSelector = require('../tokens/selectors').tokensByIdSelector as TokensByIdSelector
  const networkConfig = require('../web3/networkConfig').default as NetworkConfig
  const Screens = require('../navigator/Screens').Screens as ScreensType
  const FiatExchangeFlow = require('../fiatExchanges/types')
    .FiatExchangeFlow as FiatExchangeFlowType
  const CICOFlow = require('../fiatExchanges/types').CICOFlow as CICOFlowType

  // TODO: remove the need to cast once we're able to ship declaration files
  const [routeName, params] = args as NavigateArgs<StackParamList>

  switch (routeName) {
    case 'Send':
      internalNavigate(Screens.SendSelectRecipient)
      break
    case 'Receive':
      internalNavigate(Screens.QRNavigator, {
        screen: Screens.QRCode,
      })
      break
    case 'Swap':
      internalNavigate(
        Screens.SwapScreenWithBack,
        params
          ? {
              fromTokenId: params.fromTokenId,
              toTokenId: params.toTokenId,
              toTokenNetworkId: params.toTokenNetworkId as InternalNetworkId,
            }
          : undefined
      )
      break
    case 'Add':
      if (params?.tokenId) {
        const networkIds = Object.values(networkConfig.networkToNetworkId)
        const tokens = tokensByIdSelector(store.getState(), {
          networkIds,
        })
        const tokenInfo = params ? tokens[params.tokenId] : undefined
        if (tokenInfo && tokenInfo.isCashInEligible) {
          // TODO: we should refactor FiatExchangeAmount so it can accept just a tokenId, without the need for the tokenSymbol
          internalNavigate(Screens.FiatExchangeAmount, {
            tokenId: params.tokenId,
            flow: CICOFlow.CashIn,
            tokenSymbol: tokenInfo.symbol,
          })
          return
        } else {
          Logger.warn(
            TAG,
            `Unable to find a token eligible for cash in with tokenId: ${params?.tokenId}`
          )
        }
      }

      internalNavigate(Screens.FiatExchangeCurrencyBottomSheet, { flow: FiatExchangeFlow.CashIn })
      break
    case 'Withdraw':
      internalNavigate(Screens.WithdrawSpend)
      break
    case 'TabWallet':
      internalNavigate(Screens.TabWallet)
      break
    case 'TabActivity':
      internalNavigate(Screens.TabHome)
      break
    case 'TabEarn':
      internalNavigate(Screens.TabEarn)
      break
    case 'TabDiscover':
      internalNavigate(Screens.TabDiscover)
      break
    default:
      const exhaustiveCheck: never = routeName
      // This handles custom defined screens
      // Though also allows navigating to internal screens...
      internalNavigate(routeName, params)
      return exhaustiveCheck
  }
}
