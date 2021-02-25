import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { Text, StyleSheet, View } from 'react-native'
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
import { SimplexService } from 'src/fiatExchanges/services/SimplexService'
import deviceInfoModule from 'react-native-device-info'
import { e164NumberSelector } from 'src/account/selectors'
import { sessionIdSelector } from 'src/app/selectors'
import InAppBrowser from 'src/components/InAppBrowser'
import WebView, { WebViewRef } from 'src/components/WebView'

const MIN_USD_TX_AMOUNT = 15

export const simplexOptions = () => ({
  ...emptyHeader,
})

type RouteProps = StackScreenProps<StackParamList, Screens.Simplex>
type Props = RouteProps

const simplex = SimplexService.getInstance()

function SimplexScreen({ route }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)

  const [exchange, setExchange] = React.useState<any>({})
  const [paymentId, setPaymentId] = React.useState('')

  let minTxAmount = MIN_USD_TX_AMOUNT

  if (currencyCode !== LocalCurrencyCode.USD) {
    const localTxMin = convertDollarsToLocalAmount(minTxAmount, localCurrencyExchangeRate)
    minTxAmount = localTxMin?.toNumber() || MIN_USD_TX_AMOUNT
  }

  const asset = {
    [CURRENCY_ENUM.GOLD]: 'CELO',
    [CURRENCY_ENUM.DOLLAR]: 'CUSD',
  }[currencyToBuy]

  const e164PhoneNumber = useSelector(e164NumberSelector)
  const userId = deviceInfoModule.getUniqueId()

  useEffect(() => {
    simplex
      .getQuote(userId, asset, currencyCode, currencyCode, localAmount)
      .then((_) => _.json())
      .then(({ quote_id, fiat_money, digital_money }) =>
        setExchange({
          quoteId: quote_id,
          fiat: {
            currency: fiat_money.currency,
            amount: fiat_money.total_amount,
          },
          crypto: {
            currency: digital_money.currency,
            amount: digital_money.amount,
          },
        })
      )
  }, [])

  useEffect(() => {
    if (!exchange?.quoteId) {
      return
    }
    simplex
      .paymentRequest({
        userId,
        quoteId: exchange?.quoteId,
        app: {
          version: deviceInfoModule.getVersion(),
          installDate: deviceInfoModule.getFirstInstallTimeSync(),
        },
        address: account || '',
        asset,
        verified: {
          email: false,
          phone: true,
        },
        phone: e164PhoneNumber || '',
        email: '',
      })
      .then((id) => setPaymentId(id))
  }, [exchange?.quoteId])

  const checkoutHtml = simplex.generateForm(paymentId)

  return (
    <>
      {!paymentId ? (
        <Text>Simplex -{JSON.stringify(exchange)}-</Text>
      ) : (
        // : <InAppBrowser html={checkoutHtml} onCancel={navigateBack} />
        <View style={styles.container}>
          <WebView originWhitelist={['*']} source={{ html: checkoutHtml }} />
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
  },
})

export default SimplexScreen
