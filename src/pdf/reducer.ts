import { Actions, ActionTypes } from 'src/pdf/actions'
import { RootState } from 'src/redux/reducers'

export interface State {
  transactionStatementLocation: string | undefined
  loading: boolean
  payload: any
}

export const initialState: State = {
  transactionStatementLocation: undefined,
  loading: false,
  payload: undefined,
}

export const pdfLoadingSelector = (state: RootState) => state.pdf.loading
export const currentPdfDataSelector = (state: RootState) => state.pdf.payload
export const currentPdfLocationSelector = (state: RootState) =>
  state.pdf.transactionStatementLocation

export const reducer = (state: State | undefined = initialState, action: ActionTypes): State => {
  switch (action.type) {
    case Actions.GENERATE_PDF:
      return {
        ...state,
        payload: action.content,
        loading: true,
      }
    case Actions.SAVING_PDF:
      return {
        ...state,
        transactionStatementLocation: action.filePath,
        payload: undefined,
        loading: false,
      }
    case Actions.OPENING_PDF:
      return {
        ...state,
        transactionStatementLocation: undefined,
      }
    case Actions.CLOSE_EXPORT:
      return {
        ...state,
        transactionStatementLocation: undefined,
        loading: false,
      }
    default:
      return { ...state }
  }
}

export const pdfDataSelector = (state: RootState) => state.pdf.payload
