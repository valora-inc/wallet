import BigNumber from 'bignumber.js'
import { FeeType } from 'src/fees/reducer'
import { RootState } from 'src/redux/reducers'
import { TokenBalance } from 'src/tokens/slice'
import { divideByWei } from 'src/utils/formatting'

export function getFeeInTokens(feeInWei: BigNumber.Value | null | undefined) {
  return feeInWei ? divideByWei(feeInWei) : undefined
}

export const feeEstimatesSelector = (state: RootState) => state.fees.estimates

export function getFeeEstimateDollars(
  feeType: FeeType | null,
  tokenInfo: TokenBalance | undefined
) {
  return (state: RootState) => {
    // TODO(ACT-1075): Clean up
    if (!feeType || !tokenInfo?.address) {
      return null
    }
    const fee = state.fees.estimates[tokenInfo.address]?.[feeType]?.usdFee
    return fee ? new BigNumber(fee) : null
  }
}
