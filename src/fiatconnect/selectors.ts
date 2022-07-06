import { RootState } from 'src/redux/reducers'

export const transferOutSelector = (state: RootState) => state.fiatconnect.transfersOut
