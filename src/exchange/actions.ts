import { ExchangeRate } from 'src/exchange/reducer'

export enum Actions {
  UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY = 'EXCHANGE/UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY',
}

export interface UpdateCeloGoldExchangeRateHistory {
  type: Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY
  timestamp: number
  exchangeRates: ExchangeRate[]
}

export const updateCeloGoldExchangeRateHistory = (
  exchangeRates: ExchangeRate[],
  timestamp: number
): UpdateCeloGoldExchangeRateHistory => ({
  type: Actions.UPDATE_CELO_GOLD_EXCHANGE_RATE_HISTORY,
  exchangeRates,
  timestamp,
})

export type ActionTypes = UpdateCeloGoldExchangeRateHistory
