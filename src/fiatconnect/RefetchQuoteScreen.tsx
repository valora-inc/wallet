import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import {
  cachedQuoteParamsSelector,
  fiatConnectQuotesErrorSelector,
} from 'src/fiatconnect/selectors'
import { refetchQuote } from 'src/fiatconnect/slice'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import { useTokenInfoWithAddressBySymbol } from 'src/tokens/hooks'

type Props = NativeStackScreenProps<StackParamList, Screens.FiatConnectRefetchQuote>

export default function FiatConnectRefetchQuoteScreen({ route }: Props) {
  const { providerId, kycSchema } = route.params
  const dispatch = useDispatch()
  const fiatConnectQuotesError = useSelector(fiatConnectQuotesErrorSelector)
  const cachedQuoteParamsList = useSelector(cachedQuoteParamsSelector)
  const cachedQuoteParams = cachedQuoteParamsList?.[providerId]?.[kycSchema]
  // TODO (ACT-985): remove deprecated function call when cachedQuoteParams updated to have token IDs
  const tokenInfo = useTokenInfoWithAddressBySymbol(cachedQuoteParams?.cryptoType)

  useEffect(() => {
    if (!cachedQuoteParams) {
      // For some reason, we don't have a cached quote; go to beginning of CICO flow
      navigateHome()
    } else {
      if (!tokenInfo) {
        throw new Error(`Token info not found for token symbol ${cachedQuoteParams.cryptoType}`)
      }
      dispatch(
        refetchQuote({
          flow: cachedQuoteParams.flow,
          cryptoType: cachedQuoteParams.cryptoType,
          cryptoAmount: cachedQuoteParams.cryptoAmount,
          fiatAmount: cachedQuoteParams.fiatAmount,
          providerId,
          tokenId: tokenInfo.tokenId,
        })
      )
    }
  }, [cachedQuoteParamsList, providerId, kycSchema])

  if (fiatConnectQuotesError) {
    // We have a cached quote, but there was some error while re-fetching; go to beginning of CICO flow
    navigateHome()
  }

  return (
    <View style={styles.activityIndicatorContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
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
