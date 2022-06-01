import { REHYDRATE } from 'redux-persist'
import { createSelector } from 'reselect'
import { getRehydratePayload, RehydrateAction } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'
import { Actions, ActionTypes } from 'src/swap/actions'
import { SwapDirection } from 'src/swap/types'
import { UbeswapExprimentalToken } from 'src/tokens/reducer'

export interface State {
  isLoading: boolean
  currentAssetIn: UbeswapExprimentalToken | null
  currentAssetOut: UbeswapExprimentalToken | null
}

export const initialState: State = {
  isLoading: false,
  currentAssetIn: null,
  currentAssetOut: null,
}

export const fetchSelectedAssetIn = (state: RootState) => state.swap.currentAssetIn
export const fetchSelectedAssetOut = (state: RootState) => state.swap.currentAssetOut
export const fetchSelectedSwapAssets = createSelector(
  [fetchSelectedAssetIn, fetchSelectedAssetOut],
  (currentAssetIn, currentAssetOut) => ({ currentAssetIn, currentAssetOut })
)

export const reducer = (
  state: State | undefined = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const persisted = getRehydratePayload(action, 'swap')
      return {
        ...state,
        ...persisted,
        currentAssetIn: {
          ...initialState.currentAssetIn,
          ...persisted.currentAssetIn,
        },
        currentAssetOut: {
          ...initialState.currentAssetOut,
          ...persisted.currentAssetOut,
        },
        isLoading: false,
      }
    }
    case Actions.SET_ASSET: {
      if (action.direction === SwapDirection.IN) {
        return {
          ...state,
          currentAssetIn: action.currentAsset,
        }
      } else if (action.direction === SwapDirection.OUT) {
        return {
          ...state,
          currentAssetOut: action.currentAsset,
        }
      }
      return {
        ...state,
      }
    }
    default:
      return state
  }
}
