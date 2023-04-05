import { Screens } from 'src/navigator/Screens'
export enum Actions {
  UPDATE_STATSIG_AND_NAVIGATE = 'ONBOARDING/UPDATE_STATSIG_AND_NAVIGATE',
}

export interface UpdateStatsigAndNavigateAction {
  type: Actions.UPDATE_STATSIG_AND_NAVIGATE
  screen?: Screens
}

export const updateStatsigAndNavigate = (screen?: Screens): UpdateStatsigAndNavigateAction => ({
  type: Actions.UPDATE_STATSIG_AND_NAVIGATE,
  screen: screen,
})
