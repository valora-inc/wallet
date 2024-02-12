import { RootState } from 'src/redux/reducers'

export const feeEstimatesSelector = (state: RootState) => state.fees.estimates
