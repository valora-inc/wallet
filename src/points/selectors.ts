import { createSelector } from 'reselect'
import { PointsMetadata, isPointsActivity } from 'src/points/types'
import { RootState } from 'src/redux/reducers'

export const getPointsHistoryNextPageUrlSelector = (state: RootState) => {
  return state.points.nextPageUrl
}

const pointsConfigSelector = (state: RootState) => state.points.pointsConfig

export const pointsMetadataSelector = createSelector(
  [pointsConfigSelector],
  (pointsConfig): PointsMetadata[] => {
    const pointsMetadata: PointsMetadata[] = []
    if (!pointsConfig) {
      return pointsMetadata
    }

    Object.entries(pointsConfig.activitiesById).forEach(([activityId, { points }]) => {
      if (!isPointsActivity(activityId)) {
        // should never happen but Object.entries seems to lose the type for activityId
        return
      }

      // check if there is already a metadata object for this points value,
      // either add activity to the existing points object or create a new one
      const existingMetadata = pointsMetadata.find((metadata) => metadata.points === points)
      if (existingMetadata) {
        existingMetadata.activities.push({ name: activityId })
      } else {
        pointsMetadata.push({
          points,
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
