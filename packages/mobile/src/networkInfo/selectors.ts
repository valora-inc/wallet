import { RootState } from 'src/redux/reducers'

export const networkConnectedSelector = (state: RootState) => state.networkInfo.connected
export const networkCountrySelector = (state: RootState) => state.networkInfo.networkCountry
