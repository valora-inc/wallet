import BigNumber from 'bignumber.js'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { estimateFee, FeeType } from 'src/fees/reducer'
import { fetchFeeCurrency } from 'src/fees/saga'
import { feeEstimatesSelector } from 'src/fees/selectors'
import useSelector from 'src/redux/useSelector'
import { useUsdToTokenAmount } from 'src/tokens/hooks'
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

// Returns the estimated fee for a SEND or INVITE transaction
// also optionally fetches new fee estimations if the current ones are missing or out of date
export function useEstimatedFee(
  tokenAddress: string,
  feeType: FeeType.SEND | FeeType.INVITE,
  shouldRefresh: boolean = true
) {
  const dispatch = useDispatch()

  const feeEstimates = useSelector(feeEstimatesSelector)

  // Optionally Keep Fees Up to Date
  useEffect(() => {
    if (!shouldRefresh) return
    const feeEstimate = feeEstimates[tokenAddress]?.[feeType]
    if (
      !feeEstimate ||
      feeEstimate.error ||
      feeEstimate.lastUpdated < Date.now() - ONE_HOUR_IN_MILLIS
    ) {
      dispatch(estimateFee({ feeType, tokenAddress }))
    }
  }, [tokenAddress, shouldRefresh])

  const celoAddress = useSelector(celoAddressSelector)

  // feeTokenAddress is undefined if the fee currency is CELO, we still want to
  // use the fee estimate if that is the case
  const feeTokenAddress = useFeeCurrency() ?? celoAddress

  const usdFeeEstimate = feeEstimates[tokenAddress]?.[feeType]?.usdFee
  const feeEstimate =
    useUsdToTokenAmount(new BigNumber(usdFeeEstimate ?? 0), tokenAddress) ?? new BigNumber(0)

  if (tokenAddress !== feeTokenAddress) {
    return new BigNumber(0)
  }
  return feeEstimate
}
