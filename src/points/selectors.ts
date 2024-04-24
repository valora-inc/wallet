import { createSelector } from 'reselect'
import { PointsMetadata, isPointsActivity, ClaimHistory } from 'src/points/types'
import { RootState } from 'src/redux/reducers'
import { omit } from 'lodash'

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
  (pointsHistory): (Omit<ClaimHistory, 'createdAt'> & { timestamp: number })[] => {
    return pointsHistory.map((entry) => {
      return {
        ...omit(entry, 'createdAt'),
        timestamp: Date.parse(entry.createdAt),
      }
    })
  }
)

export const pointsConfigStatusSelector = (state: RootState) => state.points.pointsConfigStatus

const pointsConfigSelector = (state: RootState) => state.points.pointsConfig

export const pointsSectionsSelector = createSelector(
  [pointsConfigSelector],
  (pointsConfig): PointsMetadata[] => {
    const pointsMetadata: PointsMetadata[] = []

    Object.entries(pointsConfig.activitiesById).forEach(([activityId, { pointsAmount }]) => {
      if (!isPointsActivity(activityId)) {
        // should never happen but Object.entries seems to lose the type for activityId
        return
      }

      // check if there is already a metadata object for this points value,
      // either add activity to the existing points object or create a new one
      const existingMetadata = pointsMetadata.find((metadata) => metadata.points === pointsAmount)
      if (existingMetadata) {
        existingMetadata.activities.push({ name: activityId })
      } else {
        pointsMetadata.push({
          points: pointsAmount,
          activities: [{ name: activityId }],
        })
      }
    })

    return pointsMetadata.sort((a, b) => {
      if (a.points < b.points) return 1
      if (a.points > b.points) return -1
      return 0
    })
  }
)

export const pendingPointsEvents = (state: RootState) => {
  return state.points.pendingPointsEvents
}
