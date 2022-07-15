import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { FiatConnectReview, reviewScreenHeader } from 'src/fiatconnect/ReviewScreen'
import {
  fiatAccountErrorSelector,
  fiatAccountLoadingSelector,
  fiatAccountSelector,
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
  fiatConnectQuotesSelector,
} from 'src/fiatconnect/selectors'
import { fetchQuoteAndFiatAccount } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CiCoCurrency, Currency } from 'src/utils/currencies'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReviewFetch>

// This component displays the Review Screen, but tries to re-fetch a quote and FiatAccount beforehand
export default function ReviewFetchScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const [tryAgain, setTryAgain] = useState(false)
  const {
    flow,
    selectedCrypto,
    cryptoAmount,
    fiatAmount,
    fiatAccountId,
    providerId,
    fiatAccountType,
  } = route.params

  const fiatAccount = useSelector(fiatAccountSelector)
  const fiatAccountError = useSelector(fiatAccountErrorSelector)
  const fiatAccountLoading = useSelector(fiatAccountLoadingSelector)

  const fiatConnectQuotes = useSelector(fiatConnectQuotesSelector)
  const fiatConnectQuotesLoading = useSelector(fiatConnectQuotesLoadingSelector)
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)

  const digitalAsset = {
    [Currency.Celo]: CiCoCurrency.CELO,
    [Currency.Dollar]: CiCoCurrency.CUSD,
    [Currency.Euro]: CiCoCurrency.CEUR,
  }[selectedCrypto]

  useEffect(() => {
    dispatch(
      fetchQuoteAndFiatAccount({
        flow,
        digitalAsset,
        cryptoAmount,
        providerId,
        fiatAccountId,
        fiatAccountType,
      })
    )
  }, [flow, digitalAsset, cryptoAmount, tryAgain, providerId, fiatAccountId, fiatAccountType])

  if (fiatAccountLoading || fiatConnectQuotesLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }
  if (fiatAccountError || fiatConnectQuotesError || !fiatAccount) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('fiatConnectReviewScreen.error.title')}</Text>
        <Text style={styles.description}>{t('fiatConnectReviewScreen.error.description')}</Text>
        <Button
          style={styles.button}
          testID="TryAgain"
          onPress={() => setTryAgain(!tryAgain)}
          text={t('fiatConnectReviewScreen.error.tryAgain')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
        />
        <Button
          style={styles.button}
          testID="SelectNewProvider"
          onPress={() => {
            navigate(Screens.SelectProvider, {
              flow,
              selectedCrypto,
              amount: {
                crypto: cryptoAmount,
                fiat: fiatAmount,
              },
            })
          }}
          text={t('fiatConnectReviewScreen.error.selectNewProvider')}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.MEDIUM}
        />
        <View style={styles.contactSupportButton}>
          <BorderlessButton
            testID="SupportContactLink"
            onPress={() => {
              navigate(Screens.SupportContact)
            }}
          >
            <Text style={styles.contactSupport}>{t('contactSupport')}</Text>
          </BorderlessButton>
        </View>
      </View>
    )
  }

  const normalizedQuote = new FiatConnectQuote({
    quote: fiatConnectQuotes[0] as FiatConnectQuoteSuccess,
    fiatAccountType,
    flow,
  })
  return (
    <FiatConnectReview normalizedQuote={normalizedQuote} flow={flow} fiatAccount={fiatAccount} />
  )
}

ReviewFetchScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReviewFetch>
}) => reviewScreenHeader(route.params.flow)

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.h2,
  },
  description: {
    ...fontStyles.regular,
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 48,
  },
  button: {
    marginTop: 13,
  },
  contactSupport: {
    ...fontStyles.regular600,
  },
  contactSupportButton: {
    marginTop: 26,
  },
})
