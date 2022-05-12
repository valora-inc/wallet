import BigNumber from 'bignumber.js'
import { fetchFeeCurrency } from 'src/fees/saga'
import useSelector from 'src/redux/useSelector'
import { tokensByCurrencySelector, tokensByUsdBalanceSelector } from 'src/tokens/selectors'
import { Fee, FeeType as TransactionFeeType } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'

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
