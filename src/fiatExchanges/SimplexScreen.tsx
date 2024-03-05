import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useLayoutEffect, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { e164NumberSelector } from 'src/account/selectors'
import { showError } from 'src/alert/actions'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { phoneNumberVerifiedSelector } from 'src/app/selectors'
import BackButton from 'src/components/BackButton'
import Button, { BtnSizes } from 'src/components/Button'
import WebView from 'src/components/WebView'
import { SIMPLEX_FEES_URL } from 'src/config'
import ReviewFees from 'src/fiatExchanges/ReviewFees'
import { fetchSimplexPaymentData } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { HeaderTitleWithBalance, emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import { useTokenInfo } from 'src/tokens/hooks'
import { resolveCurrency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

type RouteProps = NativeStackScreenProps<StackParamList, Screens.Simplex>
type Props = RouteProps

function SimplexScreen({ route, navigation }: Props) {
  const [loadSimplexCheckout, setLoadSimplexCheckout] = useState(false)
  const [redirected, setRedirected] = useState(false)
  const { t } = useTranslation()

  const { simplexQuote, tokenId } = route.params

  const account = useSelector(currentAccountSelector)
  const e164PhoneNumber = useSelector(e164NumberSelector)
  const phoneNumberConfirmed = useSelector(phoneNumberVerifiedSelector)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const { ipAddress: userIpAddress } = useSelector(userLocationDataSelector)

  const dispatch = useDispatch()

  const tokenInfo = useTokenInfo(tokenId)
  if (!tokenInfo) {
    throw new Error(`Token info not found for token ID ${tokenId}`)
  }
  const symbol = tokenInfo.symbol

  const feeIsWaived =
    simplexQuote.fiat_money.total_amount - simplexQuote.fiat_money.base_amount <= 0

  const onNavigationStateChange = ({ url }: any) => {
    if (url?.includes('/payments/new')) {
      setRedirected(true)
    } else if (url?.startsWith('celo://wallet')) {
      navigateToURI(url)
    }
  }

  const onButtonPress = () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_simplex_open_webview, {
      amount: simplexQuote.digital_money.amount,
      cryptoCurrency: symbol,
      feeInFiat: simplexQuote.fiat_money.total_amount - simplexQuote.fiat_money.base_amount,
      fiatCurrency: simplexQuote.fiat_money.currency,
    })
    setLoadSimplexCheckout(true)
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: 'Simplex',
    })
  }

  useLayoutEffect(() => {
    const token = resolveCurrency(simplexQuote.digital_money.currency)
    navigation.setOptions({
      ...emptyHeader,
      headerLeft: () => <BackButton />,
      headerTitle: () => <HeaderTitleWithBalance title={t('addFunds')} token={token} />,
    })
  }, [])

  const asyncSimplexPaymentData = useAsync(async () => {
    if (!account || !userIpAddress) {
      return
    }
    try {
      const simplexPaymentData = fetchSimplexPaymentData(
        account,
        e164PhoneNumber,
        phoneNumberConfirmed,
        simplexQuote,
        userIpAddress
      )
      return simplexPaymentData
    } catch (error) {
      dispatch(showError(ErrorMessages.SIMPLEX_PURCHASE_FETCH_FAILED))
    }
  }, [])

  const simplexPaymentRequest = asyncSimplexPaymentData?.result
  return (
    <View style={styles.container}>
      {loadSimplexCheckout && simplexPaymentRequest && !redirected && (
        <View style={[styles.container, styles.indicator]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      {!loadSimplexCheckout || !simplexPaymentRequest ? (
        <View style={styles.review}>
          <ReviewFees
            provider="Simplex"
            tokenIdToBuy={tokenId}
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
            loadingColor={colors.white}
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
  headerTitle: () => <HeaderTitleWithBalance title={i18n.t('addFunds')} />,
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
    zIndex: 1,
  },
  button: {
    margin: 16,
  },
})

export default SimplexScreen
