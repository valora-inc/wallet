export enum Actions {
  INITIALIZE_APP_REVIEW = 'APP_REVIEW/INITIALIZE_APP_REVIEW',
  UPDATE_APP_REVIEW = 'APP_REVIEW/UPDATE_APP_REVIEW',
}

export interface InitializeAppReviewAction {
  type: Actions.INITIALIZE_APP_REVIEW
}

export interface UpdateAppReviewAction {
  type: Actions.UPDATE_APP_REVIEW
  rated: boolean
}

export type ActionTypes = InitializeAppReviewAction | UpdateAppReviewAction

export function initializeAppReview(): InitializeAppReviewAction {
  return {
    type: Actions.INITIALIZE_APP_REVIEW,
  }
}

export function updateAppReview(rated = false): UpdateAppReviewAction {
  return {
    type: Actions.UPDATE_APP_REVIEW,
    rated,
  }
}
