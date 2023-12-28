import { createSelector } from 'reselect'
import { PriceHistoryStatus } from 'src/priceHistory/slice'
import { RootState } from 'src/redux/reducers'

export const priceHistoryPricesSelector = createSelector(
  [(state: RootState) => state.priceHistory, (_state: RootState, tokenId: string) => tokenId],
  (priceHistory, tokenId) => {
    return priceHistory[tokenId]?.prices ?? []
  }
)

export const priceHistoryStatusSelector = createSelector(
  [(state: RootState) => state.priceHistory, (_state: RootState, tokenId: string) => tokenId],
  (priceHistory, tokenId): PriceHistoryStatus => {
    return priceHistory[tokenId]?.status
  }
)
