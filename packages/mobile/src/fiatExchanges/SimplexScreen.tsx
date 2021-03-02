import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { sessionIdSelector } from 'src/app/selectors'
import InAppBrowser from 'src/components/InAppBrowser'
import WebView, { WebViewRef } from 'src/components/WebView'
import { CASH_IN_SUCCESS_DEEPLINK, VALORA_LOGO_URL } from 'src/config'
import { SimplexService } from 'src/fiatExchanges/services/SimplexService'
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
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

const MIN_USD_TX_AMOUNT = 15

export const simplexOptions = () => ({
  ...emptyHeader,
  headerTitle: 'Simplex',
  headerLeft: () => <TopBarTextButton title={i18n.t('global:done')} onPress={navigateBack} />,
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
  const [redirected, setRedirected] = React.useState(false)

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
      .catch(() => undefined)
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
      .catch(() => undefined)
  }, [exchange?.quoteId])

  const onNavigationStateChange = ({ url }: any) => {
    if (url?.startsWith('http')) {
      setRedirected(true)
    }
    if (url?.startsWith('celo://wallet')) {
      navigateToURI(url)
    }
  }

  const checkoutHtml = simplex.generateForm(paymentId)

  return (
    <View style={[styles.container]}>
      <>
        {paymentId && redirected ? (
          undefined
        ) : (
          <View style={[styles.container, styles.indicator]}>
            <ActivityIndicator size="large" color={colors.greenBrand} />
          </View>
        )}
        {!paymentId ? (
          undefined
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: checkoutHtml }}
            onNavigationStateChange={onNavigationStateChange}
          />
        )}
      </>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
})

export default SimplexScreen
