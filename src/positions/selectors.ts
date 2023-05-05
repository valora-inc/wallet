import { RootState } from 'src/redux/reducers'

export const positionsSelector = (state: RootState) => state.positions.positions
export const positionsStatusSelector = (state: RootState) => state.positions.status
