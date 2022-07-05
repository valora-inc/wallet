import { SwapDirection } from 'src/swap/types'
import { UbeswapExprimentalToken } from 'src/tokens/reducer'

export enum Actions {
  SET_ASSET = 'SWAP/SET_ASSET',
  SET_AMOUNT = 'SWAP/SET_AMOUNT',
}

export interface SetAssetAction {
  type: Actions.SET_ASSET
  direction: SwapDirection
  currentAsset: UbeswapExprimentalToken | null
}

export interface SetAssetAmountAction {
  type: Actions.SET_AMOUNT
  direction: SwapDirection
  amount: number
}

export const setSwapAsset = (
  currentAsset: UbeswapExprimentalToken,
  direction: SwapDirection
): SetAssetAction => ({
  type: Actions.SET_ASSET,
  direction: direction,
  currentAsset: currentAsset,
})

export const setSwapAssetAmount = (
  amount: number,
  direction: SwapDirection
): SetAssetAmountAction => ({
  type: Actions.SET_AMOUNT,
  direction: direction,
  amount: amount,
})

export type ActionTypes = SetAssetAction | SetAssetAmountAction
