import Button, { BtnSizes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import deviceInfoModule from 'react-native-device-info'
import { useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import BackButton from 'src/components/BackButton'
import WebView from 'src/components/WebView'
import ReviewFees from 'src/fiatExchanges/ReviewFees'
import { SimplexService } from 'src/fiatExchanges/services/SimplexService'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

const MIN_USD_TX_AMOUNT = 15

export const simplexOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  headerTitle: () => <HeaderTitleWithBalance title={i18n.t('fiatExchangeFlow:addFunds')} />,
})

type RouteProps = StackScreenProps<StackParamList, Screens.Simplex>
type Props = RouteProps

const simplex = SimplexService.getInstance()

function SimplexScreen({ route, navigation }: Props) {
  const { localAmount, currencyCode, currencyToBuy } = route.params
  const account = useSelector(currentAccountSelector)
  const localCurrencyExchangeRate = useSelector(getLocalCurrencyExchangeRate)

  const [exchange, setExchange] = React.useState<any>(null)
  const [paymentId, setPaymentId] = React.useState('')
  const [continueToService, setContinueToService] = React.useState(false)
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

  useLayoutEffect(() => {
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: () => (
        <HeaderTitleWithBalance title={i18n.t('fiatExchangeFlow:addFunds')} token={currencyToBuy} />
      ),
    })
  }, [])

  useEffect(() => {
    simplex
      .getQuote(userId, asset, currencyCode, currencyCode, localAmount)
      .then((_) => _.json())
      .then(({ quote_id, fiat_money, digital_money }) =>
        setExchange({
          quoteId: quote_id,
          fiat: {
            currency: fiat_money.currency,
            amount: fiat_money.base_amount,
            total: fiat_money.total_amount,
            fees: fiat_money.total_amount - fiat_money.base_amount,
          },
          crypto: {
            currency: digital_money.currency,
            amount: digital_money.amount,
            price: fiat_money.base_amount / digital_money.amount,
          },
        })
      )
      .catch(console.error)
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
      .catch(console.error)
  }, [exchange?.quoteId])

  const onNavigationStateChange = ({ url }: any) => {
    if (url?.startsWith('http')) {
      setRedirected(true)
    }
    if (url?.startsWith('celo://wallet')) {
      navigateToURI(url)
    }
  }

  const onContinueToServce = () => {
    setContinueToService(true)
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: 'Simplex',
    })
  }

  const checkoutHtml = simplex.generateForm(paymentId)

  return (
    <View style={[styles.container]}>
      <>
        {!paymentId || !exchange || (!redirected && continueToService) ? (
          <View style={[styles.container, styles.indicator]}>
            <ActivityIndicator size="large" color={colors.greenBrand} />
          </View>
        ) : (
          undefined
        )}
        {exchange && !continueToService ? (
          <View style={[styles.review]}>
            <ReviewFees
              service="Simplex"
              currencyToBuy={currencyToBuy}
              localCurrency={currencyCode}
              fiat={exchange.fiat}
              crypto={exchange.crypto}
              feesContent="Fees content"
            />
            <Button
              style={styles.button}
              size={BtnSizes.FULL}
              text={'Continue to Simplex'}
              onPress={onContinueToServce}
              disabled={!paymentId}
            />
          </View>
        ) : (
          undefined
        )}
        {paymentId ? (
          <WebView
            originWhitelist={['*']}
            source={{ html: checkoutHtml }}
            onNavigationStateChange={onNavigationStateChange}
          />
        ) : (
          undefined
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
  review: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  button: {
    margin: 16,
  },
})

export default SimplexScreen

// {
//   "digital_money": {
//     "amount": 76.84858032,
//     "currency": "CUSD"
//   },
//   "fiat_money": {
//     "base_amount": 66.71,
//     "currency": "EUR",
//     "total_amount": 75
//   },
//   "quote_id": "3a4f4103-ec45-4294-9333-68173f5738c1",
//   "supported_digital_currencies": [
//     "CUSD",
//     "CELO"
//   ],
//   "supported_fiat_currencies": [
//     "EUR",
//     "JPY",
//     "CAD",
//     "GBP",
//     "RUB",
//     "AUD",
//     "KRW",
//     "CHF",
//     "CZK",
//     "DKK",
//     "NOK",
//     "NZD",
//     "PLN",
//     "SEK",
//     "TRY",
//     "ZAR",
//     "HUF",
//     "ILS",
//     "INR",
//     "UAH",
//     "HKD",
//     "MYR",
//     "NGN",
//     "SGD",
//     "TWD",
//     "BGN",
//     "BRL",
//     "MAD",
//     "RON",
//     "MXN",
//     "VND",
//     "KZT",
//     "PHP",
//     "DOP",
//     "PEN",
//     "ARS",
//     "COP",
//     "MDL",
//     "QAR",
//     "UZS",
//     "GEL",
//     "CNY",
//     "UYU",
//     "CLP",
//     "CRC",
//     "AZN",
//     "NAD",
//     "USD",
//     "AED",
//     "IDR"
//   ],
//   "user_id": "a0b28d4747484c66",
//   "valid_until": "2021-03-03T14:52:05.897Z",
//   "wallet_id": "valorapp"
// }
