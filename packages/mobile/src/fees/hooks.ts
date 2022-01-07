import BigNumber from 'bignumber.js'
import { useEffect } from 'react'
import { useAsync, UseAsyncReturn } from 'react-async-hook'
import { useDispatch } from 'react-redux'
import { showErrorOrFallback } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { getEscrowTxGas } from 'src/escrow/saga'
import { FeeType } from 'src/fees/reducer'
import { calculateFee, FeeInfo, fetchFeeCurrency } from 'src/fees/saga'
import { WEI_DECIMALS } from 'src/geth/consts'
import useSelector from 'src/redux/useSelector'
import { STATIC_SEND_TOKEN_GAS_ESTIMATE } from 'src/send/saga'
import {
  tokensByCurrencySelector,
  tokensByUsdBalanceSelector,
  tokensListSelector,
} from 'src/tokens/selectors'
import { Fee } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getRegisterDekTxGas } from 'src/web3/dataEncryptionKey'
import { walletAddressSelector } from 'src/web3/selectors'
import { FeeType as TransactionFeeType } from 'src/transactions/types'

async function getSendGasFeeEstimate(
  address: string,
  feeCurrency: Currency,
  tokenAddress: string,
  recipientAddress: string,
  amount: BigNumber,
  includeDekFee?: boolean
) {
  // TODO: This static estimate might not be accurate for non cUSD/cEUR/CELO tokens.
  let gas = new BigNumber(STATIC_SEND_TOKEN_GAS_ESTIMATE)
  if (includeDekFee) {
    const dekGas = await getRegisterDekTxGas(address, feeCurrency)
    gas = gas.plus(dekGas)
  }

  return calculateFee(gas, feeCurrency)
}

async function getInviteFeeEstimate(feeCurrency: Currency) {
  // TODO: This static estimate might not be accurate for non cUSD/cEUR/CELO tokens.
  const gas = await getEscrowTxGas()
  return calculateFee(gas, feeCurrency)
}

// Note: This hook can't be called with different values for feeType on re-renders or it will fail.
export function useEstimateGasFee(
  feeType: FeeType,
  tokenAddress: string,
  recipientAddress: string | undefined,
  amount: BigNumber,
  includeDekFee?: boolean
): UseAsyncReturn<FeeInfo, never[]> {
  const address = useSelector(walletAddressSelector)!
  const feeCurrency = useFeeCurrency()
  const dispatch = useDispatch()

  const result = useAsync(async () => {
    let feeInfo: FeeInfo | null = null
    switch (feeType) {
      case FeeType.SEND:
        // If it's a send the recipient address is set.
        feeInfo = await getSendGasFeeEstimate(
          address,
          feeCurrency,
          tokenAddress,
          recipientAddress!,
          amount,
          includeDekFee
        )
      case FeeType.INVITE:
        feeInfo = await getInviteFeeEstimate(feeCurrency)
    }
    if (!feeInfo) {
      throw new Error(`Fee Type unsupported: ${feeType}`)
    }
    // Note that the division is using WEI_DECIMALS, which only works if all the fee currencies have the same number of decimals.
    return {
      ...feeInfo,
      fee: feeInfo.fee.dividedBy(Math.pow(10, WEI_DECIMALS)),
    }
  }, [])

  useEffect(() => {
    if (result?.error) {
      Logger.error('CalculateFee', 'Error calculating fee', result.error)
      dispatch(showErrorOrFallback(result.error, ErrorMessages.CALCULATE_FEE_FAILED))
    }
  }, [result?.error])

  return result
}

export function useFeeCurrency(): Currency {
  const tokens = useSelector(tokensByUsdBalanceSelector)
  return fetchFeeCurrency(tokens)
}

export function useFeeTokenAddress(): string | undefined {
  const feeCurrency = useFeeCurrency()
  const tokensByCurrency = useSelector(tokensByCurrencySelector)
  return tokensByCurrency[feeCurrency]?.address
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
