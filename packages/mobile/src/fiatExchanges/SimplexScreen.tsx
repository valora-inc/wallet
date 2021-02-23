import { StackScreenProps } from '@react-navigation/stack'
import React from 'react'
import { Text } from 'react-native'
import { useSelector } from 'react-redux'
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

const MIN_USD_TX_AMOUNT = 15

export const simplexOptions = () => ({
  ...emptyHeader,
})

type RouteProps = StackScreenProps<StackParamList, Screens.SimplexScreen>
type Props = RouteProps

function SimplexScreen({ route }: Props) {
  const { localAmount, currencyCode } = route.params
  const account = useSelector(currentAccountSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)

  let minTxAmount = MIN_USD_TX_AMOUNT

  if (currencyCode !== LocalCurrencyCode.USD) {
    const localTxMin = convertDollarsToLocalAmount(minTxAmount, localCurrencyExchangeRate)
    minTxAmount = localTxMin?.toNumber() || MIN_USD_TX_AMOUNT
  }

  const uri = `
      ?userAddress=${account}
      &hostAppName=Valora
      &hostLogoUrl=${VALORA_LOGO_URL}
      &fiatCurrency=${currencyCode}
      &fiatValue=${localAmount || minTxAmount}
      &finalUrl=${encodeURIComponent(CASH_IN_SUCCESS_DEEPLINK)}
    `.replace(/\s+/g, '')
  console.log(uri)

  return <Text>Simplex</Text>
}

export default SimplexScreen
