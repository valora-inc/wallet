import { createSelector } from 'reselect'
import { ClaimHistoryCardItem, PointsActivity, PointsActivityId } from 'src/points/types'
import { RootState } from 'src/redux/reducers'

export const nextPageUrlSelector = (state: RootState) => {
  return state.points.nextPageUrl
}

export const pointsHistoryStatusSelector = (state: RootState) => {
  return state.points.getHistoryStatus
}

const rawPointsHistorySelector = (state: RootState) => {
  return state.points.pointsHistory
}

export const pointsHistorySelector = createSelector(
  [rawPointsHistorySelector],
  (pointsHistory): ClaimHistoryCardItem[] => {
    return pointsHistory.map((entry) => {
      const { createdAt, ...rest } = entry
      return {
        ...rest,
        timestamp: Date.parse(entry.createdAt),
      }
    })
  }
)

export const trackOnceActivitiesSelector = (state: RootState) => {
  return state.points.trackOnceActivities
}

export const pointsConfigStatusSelector = (state: RootState) => state.points.pointsConfigStatus

const pointsConfigSelector = (state: RootState) => state.points.pointsConfig

export const pointsActivitiesSelector = createSelector(
  [pointsConfigSelector, trackOnceActivitiesSelector],
  (pointsConfig, trackOnceActivities) => {
    const excludedActivities = new Set<PointsActivityId>()
    // add excluded activities based on user properties as needed.

    return (
      Object.entries(pointsConfig.activitiesById).map(([activityId, metadata]) => ({
        ...metadata,
        activityId,
        completed: trackOnceActivities[activityId as PointsActivityId] ?? false,
      })) as PointsActivity[]
    ).filter(({ activityId }) => !excludedActivities.has(activityId))
  }
)

export const pendingPointsEventsSelector = (state: RootState) => {
  return state.points.pendingPointsEvents
}

export const pointsBalanceSelector = (state: RootState) => {
  return state.points.pointsBalance
}

export const pointsBalanceStatusSelector = (state: RootState) => {
  return state.points.pointsBalanceStatus
}

export const pointsIntroHasBeenDismissedSelector = (state: RootState) => {
  return state.points.introHasBeenDismissed
}
