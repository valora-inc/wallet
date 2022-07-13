import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import BackButton from 'src/components/BackButton'
import BorderlessButton from 'src/components/BorderlessButton'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import CancelButton from 'src/components/CancelButton'
import { FiatConnectQuoteSuccess } from 'src/fiatconnect'
import { FiatConnectReview } from 'src/fiatconnect/ReviewScreen'
import {
  fiatAccountErrorSelector,
  fiatAccountLoadingSelector,
  fiatAccountSelector,
  fiatConnectQuotesErrorSelector,
  fiatConnectQuotesLoadingSelector,
  fiatConnectQuotesSelector,
  mostRecentFiatAccountSelector,
} from 'src/fiatconnect/selectors'
import { fetchQuoteAndFiatAccount } from 'src/fiatconnect/slice'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { CiCoCurrency, Currency } from 'src/utils/currencies'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReviewFetch>

export default function ReviewFetchScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const [tryAgain, setTryAgain] = useState(false)
  const { flow, selectedCrypto, cryptoAmount, fiatAmount } = route.params

  const mostRecentFiatAccount = useSelector(mostRecentFiatAccountSelector)

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
    if (mostRecentFiatAccount) {
      const { providerId, fiatAccountId, fiatAccountType } = mostRecentFiatAccount
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
    } else {
      // If there are no recent fiat accounts, navigate to the select provider screen.
      // This state can be reached if the provider does have any record of a requested
      // fiatAccount and we then remove the record of the fiatAccount from redux.
      navigate(Screens.SelectProvider, {
        flow,
        selectedCrypto,
        amount: {
          crypto: cryptoAmount,
          fiat: fiatAmount,
        },
      })
    }
  }, [flow, digitalAsset, cryptoAmount, mostRecentFiatAccount, tryAgain])

  if (fiatAccountLoading || fiatConnectQuotesLoading) {
    return (
      <View style={styles.activityIndicatorContainer}>
        <ActivityIndicator size="large" color={colors.greenBrand} />
      </View>
    )
  }
  if (fiatAccountError || fiatConnectQuotesError || !fiatAccount || !mostRecentFiatAccount) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('linkBankAccountScreen.stepTwo.error.title')}</Text>
        <Text style={styles.description}>
          {t('linkBankAccountScreen.stepTwo.error.description')}
        </Text>
        <Button
          style={styles.button}
          testID="TryAgain"
          onPress={() => setTryAgain(!tryAgain)}
          text={t('try again')}
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
          text={t('Select New Provider')}
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
    fiatAccountType: mostRecentFiatAccount.fiatAccountType,
    flow,
  })
  return (
    <FiatConnectReview normalizedQuote={normalizedQuote} flow={flow} fiatAccount={fiatAccount} />
  )
}

ReviewFetchScreen.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.FiatConnectReview>
}) => ({
  ...emptyHeader,
  headerLeft: () => <BackButton />,
  // NOTE: copies for cash in not final
  headerTitle:
    route.params.flow === CICOFlow.CashIn
      ? i18n.t(`fiatConnectReviewScreen.cashIn.header`)
      : i18n.t(`fiatConnectReviewScreen.cashOut.header`),
  // TODO(any): when tying this component to the flow, add `onCancel` prop to
  // navigate to correct screen.
  headerRight: () => <CancelButton style={styles.cancelBtn} />,
})

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
