import { Actions, ActionTypes, AlertTypes, ShowAlertAction } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { ALERT_BANNER_DURATION } from 'src/config'
import {
  Actions as ExchangeActions,
  ActionTypes as ExchangeActionTypes,
} from 'src/exchange/actions'
import i18n from 'src/i18n'
import { RootState } from 'src/redux/reducers'

export enum ErrorDisplayType {
  'BANNER',
  'INLINE',
}

export interface State {
  activeAlert: {
    type: 'message' | 'error'
    displayMethod: ErrorDisplayType
    message: string
    dismissAfter?: number | null
    buttonMessage?: string | null
    action?: object | null
    title?: string | null
    underlyingError?: ErrorMessages | null
    preventReappear?: boolean
  } | null
  dismissedAlerts: string[]
}

const initialState = {
  activeAlert: null,
  dismissedAlerts: [],
}

const errorAction = (error: ErrorMessages): ShowAlertAction => ({
  type: Actions.SHOW,
  alertType: AlertTypes.ERROR,
  displayMethod: ErrorDisplayType.BANNER,
  message: i18n.t(error),
  dismissAfter: ALERT_BANNER_DURATION,
  buttonMessage: null,
  title: null,
  underlyingError: error,
})

export const reducer = (
  state: State = initialState,
  action: ActionTypes | ExchangeActionTypes
): State => {
  switch (action.type) {
    case ExchangeActions.WITHDRAW_CELO_FAILED:
      action = errorAction(action.error)
    case Actions.SHOW:
      return {
        ...state,
        ...(!state.dismissedAlerts.includes(action.message) && {
          activeAlert: {
            displayMethod: action.displayMethod,
            type: action.alertType,
            message: action.message,
            dismissAfter: action.dismissAfter,
            buttonMessage: action.buttonMessage,
            action: action.action,
            title: action.title,
            underlyingError: action.underlyingError,
            preventReappear: action.preventReappear,
          },
        }),
      }
    case Actions.HIDE:
      return {
        ...state,
        activeAlert: null,
      }
    case Actions.HIDE_FOR_SESSION:
      return {
        ...state,
        dismissedAlerts: [...state.dismissedAlerts, action.alertMessage],
        activeAlert: null,
      }
    default:
      if (state.activeAlert?.action === action) {
        // Hide alert when the alert action is dispatched
        return {
          ...state,
          activeAlert: null,
        }
      }
      return state
  }
}

export const errorSelector = (state: RootState) => {
  return state.alert.activeAlert ? state.alert.activeAlert.underlyingError || null : null
}

export const activeAlertSelector = (state: RootState) => {
  return state.alert.activeAlert
}

export const dismissedAlertsSelector = (state: RootState) => {
  return state.alert.dismissedAlerts
}
