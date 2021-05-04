import Button, { BtnSizes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { numberVerifiedSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import WebView from 'src/components/WebView'
import { CurrencyCode, SIMPLEX_FEES_URL } from 'src/config'
import ReviewFees from 'src/fiatExchanges/ReviewFees'
import { fetchSimplexPaymentData } from 'src/fiatExchanges/utils'
import i18n, { Namespaces } from 'src/i18n'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { emptyHeader, HeaderTitleWithBalance } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

type RouteProps = StackScreenProps<StackParamList, Screens.Simplex>
type Props = RouteProps

function SimplexScreen({ route, navigation }: Props) {
  const [loadSimplexCheckout, setLoadSimplexCheckout] = useState(false)
  const [redirected, setRedirected] = useState(false)
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const { simplexQuote, userIpAddress } = route.params

  const account = useSelector(currentAccountSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const phoneNumberConfirmed = useSelector(numberVerifiedSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)

  const currencyToBuy =
    simplexQuote.digital_money.currency.toUpperCase() === 'CUSD'
      ? CurrencyCode.CUSD
      : CurrencyCode.CELO

  const feeIsWaived =
    simplexQuote.fiat_money.total_amount - simplexQuote.fiat_money.base_amount <= 0

  const onNavigationStateChange = ({ url }: any) => {
    if (url?.endsWith('step=card_details')) {
      setRedirected(true)
    } else if (url?.startsWith('celo://wallet')) {
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
      simplexQuote.digital_money.currency.toLowerCase() === 'cusd' ? Currency.Dollar : Currency.Celo
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: () => <HeaderTitleWithBalance title={t('addFunds')} token={token} />,
    })
  }, [])

  const asyncSimplexPaymentData = useAsync(async () => {
    if (!account) {
      return
    }
    return fetchSimplexPaymentData(
      account,
      e164PhoneNumber,
      phoneNumberConfirmed,
      simplexQuote,
      userIpAddress
    )
  }, [])

  const simplexPaymentRequest = asyncSimplexPaymentData?.result

  useEffect(() => {
    if (asyncSimplexPaymentData.status === 'error') {
      showError(ErrorMessages.SIMPLEX_PURCHASE_FETCH_FAILED)
    }
  }, [asyncSimplexPaymentData.status])

  return (
    <View style={styles.container}>
      {loadSimplexCheckout && simplexPaymentRequest && !redirected && (
        <View style={[styles.container, styles.indicator]}>
          <ActivityIndicator size="large" color={colors.greenUI} />
        </View>
      )}
      {!loadSimplexCheckout || !simplexPaymentRequest ? (
        <View style={styles.review}>
          <ReviewFees
            provider="Simplex"
            currencyToBuy={currencyToBuy}
            localCurrency={localCurrency}
            fiat={{
              subTotal: simplexQuote.fiat_money.base_amount,
              total: simplexQuote.fiat_money.total_amount,
            }}
            crypto={{
              amount: simplexQuote.digital_money.amount,
            }}
            feeWaived={feeIsWaived}
            feeUrl={SIMPLEX_FEES_URL}
          />
          <Button
            style={styles.button}
            size={BtnSizes.FULL}
            text={t('continueToProvider', { provider: 'Simplex' })}
            onPress={onButtonPress}
            disabled={!simplexPaymentRequest?.paymentId}
            showLoading={asyncSimplexPaymentData.status === 'loading'}
            loadingColor={colors.light}
          />
        </View>
      ) : (
        <WebView
          originWhitelist={['*']}
          source={{ html: simplexPaymentRequest.checkoutHtml }}
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
