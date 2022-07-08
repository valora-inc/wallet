import { RouteProp } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import BackButton from 'src/components/BackButton'
import CancelButton from 'src/components/CancelButton'
import { FiatConnectReview } from 'src/fiatconnect/ReviewScreen'
import { mostRecentFiatAccountSelector } from 'src/fiatconnect/selectors'
import { fetchFiatConnectQuotes } from 'src/fiatconnect/slice'
import { CICOFlow } from 'src/fiatExchanges/utils'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import styles from 'src/styles/styles'
import { CiCoCurrency, Currency } from 'src/utils/currencies'

type Props = StackScreenProps<StackParamList, Screens.FiatConnectReviewFetch>

export default function FiatConnectReviewScreen({ route, navigation }: Props) {
  const dispatch = useDispatch()
  const { flow, selectedCrypto, cryptoAmount } = route.params

  const mostRecentFiatAccount = useSelector(mostRecentFiatAccountSelector)

  const digitalAsset = {
    [Currency.Celo]: CiCoCurrency.CELO,
    [Currency.Dollar]: CiCoCurrency.CUSD,
    [Currency.Euro]: CiCoCurrency.CEUR,
  }[selectedCrypto]

  useEffect(() => {
    if (mostRecentFiatAccount) {
      dispatch(
        fetchFiatConnectQuotes({
          flow,
          digitalAsset,
          cryptoAmount,
          providerIds: [mostRecentFiatAccount.providerId],
        })
      )
    }
  }, [flow, digitalAsset, cryptoAmount, mostRecentFiatAccount])

  return (
    <FiatConnectReview normalizedQuote={normalizedQuote} flow={flow} fiatAccount={fiatAccount} />
  )
}

FiatConnectReviewScreen.navigationOptions = ({
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
