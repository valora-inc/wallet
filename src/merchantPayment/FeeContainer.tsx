import BigNumber from 'bignumber.js'
import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import FeeDrawer from 'src/components/FeeDrawer'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { estimateFee, FeeType } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import { useCurrencyToLocalAmount } from 'src/localCurrency/hooks'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { BASE_TAG } from 'src/merchantPayment/constants'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { fetchTokenBalances } from 'src/tokens/reducer'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { isDekRegisteredSelector } from 'src/web3/selectors'

export default function FeeContainer({ amount }: { amount: BigNumber }) {
  const LOG_TAG = BASE_TAG + 'FeeContainer'

  const dispatch = useDispatch() as (...args: unknown[]) => void
  const feeEstimates = useSelector(feeEstimatesSelector)
  const tokenInfo = useTokenInfoBySymbol(Currency.Dollar)
  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localToFeeExchangeRate = useCurrencyToLocalAmount(new BigNumber(1), Currency.Dollar)
  const currencyInfo = {
    localCurrencyCode,
    localExchangeRate: localToFeeExchangeRate?.toString() ?? '',
  }
  const tokenAddress = tokenInfo?.address

  useEffect(() => {
    dispatch(fetchTokenBalances())
  }, [dispatch])

  useEffect(() => {
    if (tokenAddress) {
      dispatch(estimateFee({ feeType: FeeType.SEND, tokenAddress }))
    }
  }, [tokenAddress])

  useEffect(() => {
    if (!isDekRegistered && tokenAddress) {
      dispatch(estimateFee({ feeType: FeeType.REGISTER_DEK, tokenAddress }))
    }
  }, [tokenAddress, isDekRegistered])

  if (!tokenAddress) {
    Logger.error(LOG_TAG, "Couldn't grab the cUSD address")
    return null
  }

  const feeEstimate = feeEstimates[tokenAddress]?.[FeeType.SEND]
  const storedDekFee = feeEstimates[tokenAddress]?.[FeeType.REGISTER_DEK]
  const securityFee = feeEstimate?.usdFee ? new BigNumber(feeEstimate.usdFee) : undefined
  const dekFee = storedDekFee?.usdFee ? new BigNumber(storedDekFee.usdFee) : undefined
  const totalFee = securityFee?.plus(dekFee ?? 0)

  return (
    <View style={styles.feeContainer}>
      <FeeDrawer
        testID={'feeDrawer/SendConfirmation'}
        isEstimate={true}
        currency={Currency.Dollar}
        securityFee={securityFee}
        showDekfee={!isDekRegistered}
        dekFee={dekFee}
        feeLoading={feeEstimate?.loading || storedDekFee?.loading}
        feeHasError={feeEstimate?.error || storedDekFee?.error}
        totalFee={totalFee}
        currencyInfo={currencyInfo}
        showLocalAmount={true}
      />
      <TokenTotalLineItem
        tokenAmount={amount}
        tokenAddress={tokenAddress}
        feeToAddInUsd={totalFee}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
})
