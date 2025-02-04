import { RootState } from 'src/redux/reducers'

export const isAppConnected = (state: RootState) => state.networkInfo.connected
