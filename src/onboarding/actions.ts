export enum Actions {
  ONBOARDING_COMPLETE = 'ONBOARDING/ONBOARDING_COMPLETE',
}

export interface OnboardingCompleteAction {
  type: Actions.ONBOARDING_COMPLETE
}

export const onboardingComplete = (): OnboardingCompleteAction => ({
  type: Actions.ONBOARDING_COMPLETE,
})
