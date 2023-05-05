import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { navigateToFiatExchangeStart } from 'src/fiatExchanges/navigator'
import {
  cachedQuoteParamsSelector,
  fiatConnectQuotesErrorSelector,
} from 'src/fiatconnect/selectors'
import { refetchQuote } from 'src/fiatconnect/slice'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatConnectRefetchQuote>

export default function FiatConnectRefetchQuoteScreen({ route }: Props) {
  const { providerId, kycSchema } = route.params
  const dispatch = useDispatch()
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)
  const cachedQuoteParamsList = useSelector(cachedQuoteParamsSelector)

  useEffect(() => {
    const cachedQuoteParams = cachedQuoteParamsList?.[providerId]?.[kycSchema]
    if (!cachedQuoteParams) {
      // For some reason, we don't have a cached quote; go to beginning of CICO flow
      navigateToFiatExchangeStart()
    } else {
      dispatch(
        refetchQuote({
          flow: cachedQuoteParams.flow,
          cryptoType: cachedQuoteParams.cryptoType,
          cryptoAmount: cachedQuoteParams.cryptoAmount,
          fiatAmount: cachedQuoteParams.fiatAmount,
          providerId,
        })
      )
    }
  }, [cachedQuoteParamsList, providerId, kycSchema])

  if (fiatConnectQuotesError) {
    // We have a cached quote, but there was some error while re-fetching; go to beginning of CICO flow
    navigateToFiatExchangeStart()
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator size="large" color={colors.greenBrand} />
    </View>
  )
}

const styles = StyleSheet.create({
  activityIndicatorContainer: {
    paddingVertical: variables.contentPadding,
    flex: 1,
    alignContent: 'center',
    justifyContent: 'center',
  },
})
