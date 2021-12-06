import BigNumber from 'bignumber.js'
import { FeeType } from 'src/fees/reducer'
import { RootState } from 'src/redux/reducers'
import { divideByWei } from 'src/utils/formatting'

export function getFeeInTokens(feeInWei: BigNumber.Value | null | undefined) {
  return feeInWei ? divideByWei(feeInWei) : undefined
}

export const feeEstimatesSelector = (state: RootState) => state.fees.estimates

export function getFeeEstimateDollars(feeType: FeeType | null, tokenAddress: string) {
  return (state: RootState) => {
    if (!feeType) {
      return null
    }
    const fee = state.fees.estimates[tokenAddress]?.[feeType]?.usdFee
    return fee ? new BigNumber(fee) : null
  }
}
