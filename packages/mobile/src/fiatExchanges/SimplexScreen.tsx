import Button, { BtnSizes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { numberVerifiedSelector, simplexFeeWaivedSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import WebView from 'src/components/WebView'
import { CurrencyCode } from 'src/config'
import ReviewFees from 'src/fiatExchanges/ReviewFees'
import Simplex from 'src/fiatExchanges/Simplex'
import { CURRENCY_ENUM } from 'src/geth/consts'
import i18n from 'src/i18n'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

type RouteProps = StackScreenProps<StackParamList, Screens.Simplex>
type Props = RouteProps

const SIMPLEX_FEES_URL =
  'https://support.simplex.com/hc/en-gb/articles/360014078420-What-fees-am-I-paying-'

function SimplexScreen({ route, navigation }: Props) {
  const [loadSimplexCheckout, setLoadSimplexCheckout] = useState(false)
  const [redirected, setRedirected] = useState(false)

  const { simplexQuote, userIpAddress } = route.params

  const account = useSelector(currentAccountSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const phoneNumberConfirmed = useSelector(numberVerifiedSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const simplexFeeWaived = useSelector(simplexFeeWaivedSelector)

  const onNavigationStateChange = ({ url }: any) => {
    if (url?.endsWith('step=card_details')) {
      setRedirected(true)
    }
    if (url?.startsWith('celo://wallet')) {
      navigateToURI(url)
    }
  }

  const onButtonPress = () => {
    setLoadSimplexCheckout(true)
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: 'Simplex',
    })
  }

  useLayoutEffect(() => {
    const token =
      simplexQuote.digital_money.currency.toLowerCase() === 'cusd'
        ? CURRENCY_ENUM.DOLLAR
        : CURRENCY_ENUM.GOLD
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: () => (
        <HeaderTitleWithBalance title={i18n.t('fiatExchangeFlow:addFunds')} token={token} />
      ),
    })
  }, [])

  const asyncSimplexPaymentRequest = useAsync(async () => {
    if (!account) {
      return
    }
    return Simplex.fetchPaymentRequest(
      account,
      e164PhoneNumber,
      phoneNumberConfirmed,
      simplexQuote,
      userIpAddress
    )
  }, [])

  const simplexPaymentRequest = asyncSimplexPaymentRequest?.result

  useEffect(() => {
    if (asyncSimplexPaymentRequest.status === 'error') {
      showError(ErrorMessages.SIMPLEX_PURCHASE_FETCH_FAILED)
    }
  }, [asyncSimplexPaymentRequest.status])

  return (
    <View style={styles.container}>
      {loadSimplexCheckout && simplexPaymentRequest && !redirected && (
        <View style={[styles.container, styles.indicator]}>
          <ActivityIndicator size="large" color={colors.light} />
        </View>
      )}
      {!loadSimplexCheckout || !simplexPaymentRequest ? (
        <View style={styles.review}>
          <ReviewFees
            provider="Simplex"
            currencyToBuy={
              simplexQuote.digital_money.currency.toUpperCase() === 'CUSD'
                ? CurrencyCode.CUSD
                : CurrencyCode.CELO
            }
            localCurrency={localCurrency}
            fiat={{
              subTotal: simplexQuote.fiat_money.base_amount,
              total: simplexQuote.fiat_money.total_amount,
              fees: simplexQuote.fiat_money.total_amount - simplexQuote.fiat_money.base_amount,
            }}
            crypto={{
              amount: simplexQuote.digital_money.amount,
              price: simplexQuote.fiat_money.base_amount / simplexQuote.digital_money.amount,
            }}
            feeWaived={simplexFeeWaived}
            feeUrl={SIMPLEX_FEES_URL}
          />
          <Button
            style={styles.button}
            size={BtnSizes.FULL}
            text={'Continue to Simplex'}
            onPress={onButtonPress}
            disabled={!simplexPaymentRequest?.paymentId}
            showLoading={asyncSimplexPaymentRequest.status === 'loading'}
          />
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: Simplex.generateCheckoutForm(simplexPaymentRequest.paymentId) }}
          onNavigationStateChange={onNavigationStateChange}
          style={{ opacity: redirected ? 100 : 0 }}
        />
      )}
    </View>
  )
}

SimplexScreen.navigationOptions = () => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  headerTitle: () => <HeaderTitleWithBalance title={i18n.t('fiatExchangeFlow:addFunds')} />,
})

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
