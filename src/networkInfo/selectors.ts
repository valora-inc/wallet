import { RootState } from 'src/redux/reducers'

export const networkConnectedSelector = (state: RootState) => state.networkInfo.connected
export const userLocationDataSelector = (state: RootState) => ({
  countryCodeAlpha2: 'NG',
  region: 'FC',
  ipAddress: '102.91.5.151',
})
