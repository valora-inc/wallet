import { pointsMetadataSelector } from 'src/points/selectors'
import { getMockStoreData } from 'test/utils'

describe('pointsMetadataSelector', () => {
  it('should return the points config as points metadata', () => {
    const stateWithPointsConfig = getMockStoreData({
      points: {
        pointsConfig: {
          activitiesById: {
            swap: { points: 10 },
            'create-wallet': { points: 10 },
          },
        },
      },
    })
    const pointsMetadata = pointsMetadataSelector(stateWithPointsConfig)

    expect(pointsMetadata).toEqual([
      {
        points: 10,
        activities: [
          { name: 'swap' },
          {
            name: 'create-wallet',
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
            swap: { points: 10 },
            'create-wallet': { points: 20 },
          },
        },
      },
    })
    const pointsMetadata = pointsMetadataSelector(stateWithPointsConfig)

    expect(pointsMetadata).toEqual([
      { points: 20, activities: [{ name: 'create-wallet' }] },
      { points: 10, activities: [{ name: 'swap' }] },
    ])
  })
})
