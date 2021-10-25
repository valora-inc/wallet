import BigNumber from 'bignumber.js'
import { useAsync } from 'react-async-hook'
import { getEscrowTxGas } from 'src/escrow/saga'
import { FeeType } from 'src/fees/actions'
import { calculateFee } from 'src/fees/saga'
import { WEI_DECIMALS } from 'src/geth/consts'
import useSelector from 'src/redux/useSelector'
import { STATIC_SEND_TOKEN_GAS_ESTIMATE } from 'src/send/saga'
import { tokensListSelector } from 'src/tokens/selectors'
import { CURRENCIES, Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { getRegisterDekTxGas } from 'src/web3/dataEncryptionKey'
import { walletAddressSelector } from 'src/web3/selectors'

const TAG = 'src/fees/hooks'

function useEstimateSendGasFee(
  tokenAddress: string,
  recipientAddress: string,
  amount: BigNumber,
  includeDekFee?: boolean
) {
  const address = useSelector(walletAddressSelector)!
  const currency = useFeeCurrency()

  const result = useAsync(async () => {
    // TODO: This static estimate might not be accurate for non cUSD/cEUR/CELO tokens.
    let gas = new BigNumber(STATIC_SEND_TOKEN_GAS_ESTIMATE)
    if (includeDekFee) {
      const dekGas = await getRegisterDekTxGas(address, currency)
      gas = gas.plus(dekGas)
    }

    const feeInfo = await calculateFee(gas, currency)
    return {
      ...feeInfo,
      fee: feeInfo.fee.dividedBy(Math.pow(10, WEI_DECIMALS)),
    }
  }, [])
  return result
}

function useEstimateInviteFee() {
  const currency = useFeeCurrency()

  const result = useAsync(async () => {
    // TODO: This static estimate might not be accurate for non cUSD/cEUR/CELO tokens.
    const gas = await getEscrowTxGas()
    return calculateFee(gas, currency)
  }, [])
  return result
}

export function useEstimateGasFee(
  feeType: FeeType,
  tokenAddress: string,
  recipientAddress: string | undefined,
  amount: BigNumber,
  includeDekFee?: boolean
) {
  switch (feeType) {
    case FeeType.SEND:
      // If it's a send the recipient address is set.
      return useEstimateSendGasFee(tokenAddress, recipientAddress!, amount, includeDekFee)
    case FeeType.INVITE:
      return useEstimateInviteFee()
  }
  throw new Error(`Fee Type unsupported: ${feeType}`)
}

function useFeeCurrency(): Currency {
  const tokens = useSelector(tokensListSelector)

  for (const currency of Object.keys(CURRENCIES) as Currency[]) {
    const balance = tokens.find((token) => token.symbol === CURRENCIES[currency].cashTag)?.balance
    if (balance?.isGreaterThan(0)) {
      return currency
    }
  }
  Logger.error(TAG, '@useFeeCurrency no currency has enough balance to pay for fee.')
  return Currency.Dollar
}
