import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { useSelector } from 'react-redux'
import InAppBrowser from 'src/components/InAppBrowser'
import { CASH_IN_SUCCESS_DEEPLINK, VALORA_LOGO_URL } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import config from 'src/geth/networkConfig'
import i18n from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarTextButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { currentAccountSelector } from 'src/web3/selectors'

const RAMP_URI = config.rampWidgetUrl
const MIN_USD_TX_AMOUNT = 15

export const rampOptions = () => ({
  ...emptyHeader,
  headerTitle: (RAMP_URI.match(/(?!(w+)\.)\w*(?:\w+\.)+\w+/) || [])[0],
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.RampScreen>
type Props = RouteProps

function RampScreen({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)

  let minTxAmount = MIN_USD_TX_AMOUNT

  if (currencyCode !== LocalCurrencyCode.USD) {
    const localTxMin = convertDollarsToLocalAmount(minTxAmount, localCurrencyExchangeRate)
    minTxAmount = localTxMin?.toNumber() || MIN_USD_TX_AMOUNT
  }

  const asset = {
    [CURRENCY_ENUM.GOLD]: 'CELO',
    [CURRENCY_ENUM.DOLLAR]: 'CUSD',
  }[currencyToBuy]

  const uri = `
    ${RAMP_URI}
      ?hostApiKey=${config.rampApiKey}
      &userAddress=${account}
      &swapAsset=${asset}
      &hostAppName=Valora
      &hostLogoUrl=${VALORA_LOGO_URL}
      &fiatCurrency=${currencyCode}
      &fiatValue=${localAmount || minTxAmount}
      &finalUrl=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
    `.replace(/\s+/g, '')

  return <InAppBrowser uri={uri} onCancel={navigateBack} />
}

export default RampScreen
