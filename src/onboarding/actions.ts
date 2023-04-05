import { StackParamList } from 'src/navigator/types'

export enum Actions {
  UPDATE_STATSIG_AND_NAVIGATE = 'ONBOARDING/UPDATE_STATSIG_AND_NAVIGATE',
}

export interface UpdateStatsigAndNavigateAction {
  type: Actions.UPDATE_STATSIG_AND_NAVIGATE
  screen?: keyof StackParamList
}

export const updateStatsigAndNavigate = (
  screen?: keyof StackParamList
): UpdateStatsigAndNavigateAction => ({
  type: Actions.UPDATE_STATSIG_AND_NAVIGATE,
  screen: screen,
})
