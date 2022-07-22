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
  fiatAccountsErrorSelector,
  fiatAccountsLoadingSelector,
  fiatAccountsSelector,
  fiatConnectProvidersLoadingSelector,
  fiatConnectProvidersSelector,
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
  fiatConnectQuotesSelector,
} from 'src/fiatconnect/selectors'
import {
  fetchFiatAccounts,
  fetchFiatConnectProviders,
  fetchFiatConnectQuotes,
} from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { quoteHasErrors } from 'src/fiatExchanges/quotes/normalizeQuotes'
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

  const fiatAccounts = useSelector(fiatAccountsSelector)
  const fiatAccountsError = useSelector(fiatAccountsErrorSelector)
  const fiatAccountsLoading = useSelector(fiatAccountsLoadingSelector)

  const fiatConnectQuotes = useSelector(fiatConnectQuotesSelector)
  const fiatConnectQuotesLoading = useSelector(fiatConnectQuotesLoadingSelector)
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)

  const fiatConnectProviders = useSelector(fiatConnectProvidersSelector)
  const fiatConnectProvidersLoading = useSelector(fiatConnectProvidersLoadingSelector)

  const provider = fiatConnectProviders?.find(({ id }) => providerId === id)
  const fiatAccount = fiatAccounts.find(
    (account) => account.fiatAccountId === fiatAccountId && account.providerId === providerId
  )
  const quote = fiatConnectQuotes.find((q) => !quoteHasErrors(q) && q.provider.id === providerId)

  const digitalAsset = {
    [Currency.Celo]: CiCoCurrency.CELO,
    [Currency.Dollar]: CiCoCurrency.CUSD,
    [Currency.Euro]: CiCoCurrency.CEUR,
  }[selectedCrypto]

  useEffect(() => {
    dispatch(
      fetchFiatConnectQuotes({
        flow,
        digitalAsset,
        cryptoAmount,
        providerIds: [providerId],
      })
    )
    // If we can't find the provider we want, there may have been an error last time providers were fetched.
    // Try refetching before proceeding.
    if (!provider) {
      dispatch(fetchFiatConnectProviders())
    } else {
      dispatch(
        fetchFiatAccounts({
          providerId,
          baseUrl: provider.baseUrl,
        })
      )
    }
  }, [
    flow,
    digitalAsset,
    cryptoAmount,
    tryAgain,
    providerId,
    fiatAccountId,
    fiatAccountType,
    provider,
  ])

  if (fiatAccountsLoading || fiatConnectQuotesLoading || fiatConnectProvidersLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }
  if (fiatAccountsError || fiatConnectQuotesError || !fiatAccount || !provider || !quote) {
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
    quote: quote as FiatConnectQuoteSuccess,
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
