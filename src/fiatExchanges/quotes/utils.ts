import { SettlementEstimation, SettlementTime } from 'src/fiatExchanges/quotes/constants'
import Logger from 'src/utils/Logger'

const TAG = 'fiatExchanges/quotes/utils'

export const getSettlementTimeString = (
  settlementEstimation: SettlementEstimation,
  settlementTimeStrings: Record<SettlementTime, string>
) => {
  switch (settlementEstimation.settlementTime) {
    case SettlementTime.LESS_THAN_ONE_HOUR:
      return { timeString: settlementTimeStrings[SettlementTime.LESS_THAN_ONE_HOUR] }
    case SettlementTime.LESS_THAN_X_HOURS:
    case SettlementTime.LESS_THAN_X_DAYS:
      return {
        timeString: settlementTimeStrings[settlementEstimation.settlementTime],
        upperBound: settlementEstimation.upperBound,
      }
    case SettlementTime.X_TO_Y_HOURS:
    case SettlementTime.X_TO_Y_DAYS:
      return {
        timeString: settlementTimeStrings[settlementEstimation.settlementTime],
        lowerBound: settlementEstimation.lowerBound,
        upperBound: settlementEstimation.upperBound,
      }
    default:
      // Should not be reachable
      Logger.warn(TAG, 'Unexpected settlement time value in settlement estimation')
      return {}
  }
}
