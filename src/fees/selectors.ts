import BigNumber from 'bignumber.js'
import { FeeType } from 'src/fees/reducer'
import { RootState } from 'src/redux/reducers'
import { TokenBalance } from 'src/tokens/slice'

/** @deprecated */ // todo add explanation of what to use instead
export const feeEstimatesSelector = (state: RootState) => state.fees.estimates

/** @deprecated */ // todo add explanation of what to use instead
export function getFeeEstimateDollars(
  feeType: FeeType | null,
  tokenInfo: TokenBalance | undefined
) {
  return (state: RootState) => {
    // TODO(ACT-922): Handle cases where address is null ex: Ethereum
    if (!feeType || !tokenInfo?.address) {
      return null
    }
    const fee = state.fees.estimates[tokenInfo.address]?.[feeType]?.usdFee
    return fee ? new BigNumber(fee) : null
  }
}
