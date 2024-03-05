import * as ReactRedux from 'react-redux'
import type { AppDispatch, RootState } from 'src/redux/store'

export const useDispatch = ReactRedux.useDispatch.withTypes<AppDispatch>()
export const useSelector = ReactRedux.useSelector.withTypes<RootState>()
