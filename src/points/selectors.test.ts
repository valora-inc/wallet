import { pointsSectionsSelector, pointsHistorySelector } from 'src/points/selectors'
import { getMockStoreData } from 'test/utils'

describe('pointsHistorySelector', () => {
  it('returns UNIX timestamp', () => {
    const stateWithPointsHistory = getMockStoreData({
      points: {
        pointsHistory: [
          {
            activityId: 'create-wallet',
            createdAt: '2024-04-22T16:32:27+0000',
            pointsAmount: 20,
          },
        ],
      },
    })
    const result = pointsHistorySelector(stateWithPointsHistory)

    expect(result).toEqual([
      {
        activityId: 'create-wallet',
        timestamp: 1713803547000,
        pointsAmount: 20,
      },
    ])
  })
})

describe('pointsMetadataSelector', () => {
  it('should return an empty array if there are no activities', () => {
    const stateWithoutPointsConfig = getMockStoreData({
      points: {
        pointsConfig: {
          activitiesById: {},
        },
      },
    })
    const result = pointsSectionsSelector(stateWithoutPointsConfig)

    expect(result).toEqual([])
  })

  it('should return the points config as points metadata', () => {
    const stateWithPointsConfig = getMockStoreData({
      points: {
        pointsConfig: {
          activitiesById: {
            swap: { pointsAmount: 10 },
            'create-wallet': { pointsAmount: 10 },
          },
        },
      },
    })
    const result = pointsSectionsSelector(stateWithPointsConfig)

    expect(result).toEqual([
      {
        pointsAmount: 10,
        activities: [
          { activityId: 'swap' },
          {
            activityId: 'create-wallet',
          },
        ],
      },
    ])
  })

  it('should return points metadata ordered by points value', () => {
    const stateWithPointsConfig = getMockStoreData({
      points: {
        pointsConfig: {
          activitiesById: {
            swap: { pointsAmount: 10 },
            'create-wallet': { pointsAmount: 20 },
          },
        },
      },
    })
    const result = pointsSectionsSelector(stateWithPointsConfig)

    expect(result).toEqual([
      { pointsAmount: 20, activities: [{ activityId: 'create-wallet' }] },
      { pointsAmount: 10, activities: [{ activityId: 'swap' }] },
    ])
  })
})
