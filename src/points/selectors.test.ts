import { pointsActivitiesSelector, pointsHistorySelector } from 'src/points/selectors'
import { getDynamicConfigParams } from 'src/statsig'
import { getMockStoreData } from 'test/utils'

jest.mock('src/statsig')

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

describe('pointsActivitiesSelector', () => {
  beforeEach(() => {
    jest
      .mocked(getDynamicConfigParams)
      .mockReturnValue({ jumpstartContracts: { 'celo-alfajores': '0x1234' } })
  })

  it('should return an empty array if there are no activities', () => {
    const stateWithoutPointsConfig = getMockStoreData({
      points: {
        pointsConfig: {
          activitiesById: {},
        },
      },
    })
    const result = pointsActivitiesSelector(stateWithoutPointsConfig)

    expect(result).toEqual([])
  })

  it('should return points activities as per config', () => {
    const stateWithPointsConfig = getMockStoreData({
      points: {
        pointsConfig: {
          activitiesById: {
            swap: { pointsAmount: 10 },
            'create-wallet': { pointsAmount: 10 },
          },
        },
        trackOnceActivities: {
          'create-wallet': true,
        },
      },
    })
    const result = pointsActivitiesSelector(stateWithPointsConfig)

    expect(result).toEqual([
      { activityId: 'swap', pointsAmount: 10, completed: false },
      { activityId: 'create-wallet', pointsAmount: 10, completed: true },
    ])
  })
})
