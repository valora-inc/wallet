import { pointsSectionsSelector, pointsHistorySelector } from 'src/points/selectors'
import { getMockStoreData } from 'test/utils'

describe('pointsHistorySelector', () => {
  it('should filter out records with unknown activityIds', () => {
    const stateWithFakeActivityId = getMockStoreData({
      points: {
        pointsHistory: [
          {
            activityId: 'swap',
            pointsAmount: 20,
            timestamp: Date.parse('2024-03-05T19:26:25.000Z'),
            metadata: {
              to: 'celo-alfajores:native',
              from: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
            },
          },
          {
            activityId: 'fake-activityId' as any,
            pointsAmount: 20,
            timestamp: Date.parse('2024-01-04T19:26:25.000Z'),
          },
          {
            activityId: 'create-wallet',
            pointsAmount: 20,
            timestamp: Date.parse('2023-12-04T19:26:25.000Z'),
          },
        ],
      },
    })
    const result = pointsHistorySelector(stateWithFakeActivityId)

    expect(result).toEqual([
      {
        activityId: 'swap',
        pointsAmount: 20,
        timestamp: Date.parse('2024-03-05T19:26:25.000Z'),
        metadata: {
          to: 'celo-alfajores:native',
          from: 'celo-alfajores:0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
        },
      },
      {
        activityId: 'create-wallet',
        pointsAmount: 20,
        timestamp: Date.parse('2023-12-04T19:26:25.000Z'),
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
