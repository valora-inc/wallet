import { Actions, ActionTypes } from 'src/localCurrency/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'

interface State {
  isLoading: boolean
  error?: boolean
  preferredCurrencyCode?: LocalCurrencyCode
  usdToLocalRate: string | null
  lastSuccessfulUpdate?: number
  fetchedCurrencyCode?: LocalCurrencyCode
}

const initialState = {
  isLoading: false,
  error: false,
  usdToLocalRate: null,
}

export const reducer = (
  state: State = initialState,
  action: ActionTypes | RehydrateAction
): State => {
  switch (action.type) {
    case REHYDRATE: {
      const persistedState = getRehydratePayload(action, 'localCurrency')

      // Ignore some persisted properties
      return {
        ...state,
        ...persistedState,
        isLoading: false,
        error: false,
      }
    }
    case Actions.FETCH_CURRENT_RATE:
      return {
        ...state,
        isLoading: true,
        error: false,
      }
    case Actions.FETCH_CURRENT_RATE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: false,
        usdToLocalRate: action.usdToLocalRate,
        lastSuccessfulUpdate: action.now,
        fetchedCurrencyCode: action.currencyCode,
      }
    case Actions.FETCH_CURRENT_RATE_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: true,
      }
    case Actions.SELECT_PREFERRED_CURRENCY:
      return {
        ...state,
        preferredCurrencyCode: action.currencyCode,
      }
    default:
      return state
  }
}
