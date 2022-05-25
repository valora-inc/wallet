import { SwapDirection } from 'src/swap/types'
import { UbeswapExprimentalToken } from 'src/tokens/reducer'

export enum Actions {
  SET_ASSET = 'SWAP/SET_ASSET',
  SET_ASSET_IN = 'SWAP/SET_ASSET_IN',
  SET_ASSET_OUT = 'SWAP/SET_ASSET_OUT',
}

export interface SetAssetAction {
  type: Actions.SET_ASSET
  direction: SwapDirection
  currentAsset: UbeswapExprimentalToken | null
}

export interface SetAssetInAction {
  type: Actions.SET_ASSET_IN
  currentAssetIn: UbeswapExprimentalToken
}

export interface SetAssetOutAction {
  type: Actions.SET_ASSET_OUT
  currentAssetOut: UbeswapExprimentalToken
}

export const setSwapAsset = (
  currentAsset: UbeswapExprimentalToken,
  direction: SwapDirection
): SetAssetAction => ({
  type: Actions.SET_ASSET,
  direction: direction,
  currentAsset: currentAsset,
})

export const setAssetIn = (currentAssetIn: UbeswapExprimentalToken): SetAssetInAction => ({
  type: Actions.SET_ASSET_IN,
  currentAssetIn,
})

export const setAssetOut = (currentAssetOut: UbeswapExprimentalToken): SetAssetOutAction => ({
  type: Actions.SET_ASSET_OUT,
  currentAssetOut,
})

export type ActionTypes = SetAssetAction | SetAssetInAction | SetAssetOutAction
