import { RootState } from 'src/redux/reducers'

export const isAppSwapsEnabledSelector = (state: RootState) => state.app.showSwapMenuInDrawerMenu
