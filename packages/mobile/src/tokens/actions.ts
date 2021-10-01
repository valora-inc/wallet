import { TokenBalances } from 'src/tokens/reducer'

export enum Actions {
  SET_TOKEN_BALANCES = 'TOKENS/SET_TOKEN_BALANCES',
}

export interface SetTokenBalancesAction {
  type: Actions.SET_TOKEN_BALANCES
  balances: TokenBalances
}

export const setTokenBalances = (balances: TokenBalances): SetTokenBalancesAction => ({
  type: Actions.SET_TOKEN_BALANCES,
  balances,
})

export type ActionTypes = SetTokenBalancesAction
