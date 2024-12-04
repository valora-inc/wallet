import { StackParamList } from 'src/navigator/types'

export enum Actions {
  UPDATE_STATSIG_AND_NAVIGATE = 'ONBOARDING/UPDATE_STATSIG_AND_NAVIGATE',
  ONBOARDING_COMPLETED = 'ONBOARDING/ONBOARDING_COMPLETED',
  UPDATE_LAST_ONBOARDING_SCREEN = 'ONBOARDING/UPDATE_LAST_ONBOARDING_SCREEN',
}

interface OnboardingCompletedAction {
  type: Actions.ONBOARDING_COMPLETED
}

interface UpdateLastOnboardingScreenAction {
  type: Actions.UPDATE_LAST_ONBOARDING_SCREEN
  screen: keyof StackParamList
}

export interface UpdateStatsigAndNavigateAction {
  type: Actions.UPDATE_STATSIG_AND_NAVIGATE
  screen: keyof StackParamList
}

export type ActionTypes =
  | OnboardingCompletedAction
  | UpdateLastOnboardingScreenAction
  | UpdateStatsigAndNavigateAction

export const updateStatsigAndNavigate = (
  screen: keyof StackParamList
): UpdateStatsigAndNavigateAction => ({
  type: Actions.UPDATE_STATSIG_AND_NAVIGATE,
  screen: screen,
})

export const onboardingCompleted = (): OnboardingCompletedAction => ({
  type: Actions.ONBOARDING_COMPLETED,
})

export function updateLastOnboardingScreen(
  screen: keyof StackParamList
): UpdateLastOnboardingScreenAction {
  return {
    type: Actions.UPDATE_LAST_ONBOARDING_SCREEN,
    screen,
  }
}
