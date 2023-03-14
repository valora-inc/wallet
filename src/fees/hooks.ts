import BigNumber from 'bignumber.js'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { estimateFee, FeeType } from 'src/fees/reducer'
import { fetchFeeCurrency } from 'src/fees/saga'
import { feeEstimatesSelector } from 'src/fees/selectors'
import useSelector from 'src/redux/useSelector'
import { useTokenInfo, useUsdToTokenAmount } from 'src/tokens/hooks'
import {
  celoAddressSelector,
  tokensByCurrencySelector,
  tokensByUsdBalanceSelector,
} from 'src/tokens/selectors'
import { Fee, FeeType as TransactionFeeType } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { ONE_HOUR_IN_MILLIS } from 'src/utils/time'

export function useFeeCurrency(): string | undefined {
  const tokens = useSelector(tokensByUsdBalanceSelector)
  return fetchFeeCurrency(tokens)
}

export function usePaidFees(fees: Fee[]) {
  const tokensByCurrency = useSelector(tokensByCurrencySelector)

  const securityFeeAmount = fees.find((fee) => fee.type === TransactionFeeType.SecurityFee)
  const dekFeeAmount = fees.find((fee) => fee.type === TransactionFeeType.EncryptionFee)
  const feeCurrencyInfo = Object.entries(tokensByCurrency).find(
    ([_, tokenInfo]) => tokenInfo?.address === securityFeeAmount?.amount.tokenAddress
  )

  const securityFee = securityFeeAmount ? new BigNumber(securityFeeAmount.amount.value) : undefined
  const dekFee = dekFeeAmount ? new BigNumber(dekFeeAmount.amount.value) : undefined
  const totalFeeOrZero = new BigNumber(0).plus(securityFee ?? 0).plus(dekFee ?? 0)
  const totalFee = totalFeeOrZero.isZero() ? undefined : totalFeeOrZero

  return {
    feeTokenAddress: securityFeeAmount?.amount.tokenAddress,
    feeCurrency: feeCurrencyInfo ? (feeCurrencyInfo[0] as Currency) : undefined,
    securityFee,
    dekFee,
    totalFee,
  }
}

// Returns the maximum amount a user can send, taking into acount gas fees required for the transaction
// also optionally fetches new fee estimations if the current ones are missing or out of date
export function useMaxSendAmount(
  tokenAddress: string,
  feeType: FeeType.SEND | FeeType.SWAP,
  shouldRefresh: boolean = true
) {
  const dispatch = useDispatch()
  const balance = useTokenInfo(tokenAddress)?.balance
  const feeEstimates = useSelector(feeEstimatesSelector)

  // Optionally Keep Fees Up to Date
  useEffect(() => {
    if (!balance) return
    if (!shouldRefresh) return
    const feeEstimate = feeEstimates[tokenAddress]?.[feeType]
    if (
      (feeType === FeeType.SWAP && balance.gt(0)) ||
      !feeEstimate ||
      feeEstimate.error ||
      feeEstimate.lastUpdated < Date.now() - ONE_HOUR_IN_MILLIS
    ) {
      dispatch(estimateFee({ feeType, tokenAddress }))
    }
  }, [tokenAddress, shouldRefresh])

  const celoAddress = useSelector(celoAddressSelector)

  // useFeeCurrency chooses which crypto will be used to pay gas fees. It looks at the valid fee currencies (cUSD, cEUR, CELO)
  // in order of highest balance and selects the first one that has more than a minimum threshhold of balance
  // if CELO is selected then it actually returns undefined
  const feeTokenAddress = useFeeCurrency() ?? celoAddress

  const usdFeeEstimate = feeEstimates[tokenAddress]?.[feeType]?.usdFee
  const feeEstimate =
    useUsdToTokenAmount(new BigNumber(usdFeeEstimate ?? 0), tokenAddress) ?? new BigNumber(0)

  if (!balance) {
    return new BigNumber(0)
  }
  // For example, if you are sending cUSD but you have more CELO this will be true
  if (tokenAddress !== feeTokenAddress) {
    return balance
  }
  return balance.minus(feeEstimate)
}
