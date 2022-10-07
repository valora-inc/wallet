import { Actions, ActionTypes } from 'src/goldToken/actions'

export interface State {
  balance: string | null
  lastFetch: number | null
  educationCompleted: boolean
  kolektivoNotifications: { [key: string]: boolean }
}

export const initialState = {
  balance: null,
  lastFetch: null,
  educationCompleted: false,
  kolektivoNotifications: { cicoPrompt: true },
}

export function reducer(state: State | undefined = initialState, action: ActionTypes): State {
  switch (action.type) {
    case Actions.SET_BALANCE:
      return {
        ...state,
        balance: action.balance,
        lastFetch: Date.now(),
      }
    case Actions.SET_EDUCATION_COMPLETED:
      return {
        ...state,
        educationCompleted: action.educationCompleted,
      }
    case Actions.SET_CICO_COMPLETED:
      return {
        ...state,
        kolektivoNotifications: {
          ...state.kolektivoNotifications,
          cicoPrompt: action.cicoPrompt,
        },
      }
    default:
      return state
  }
}
