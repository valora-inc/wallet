import { pointsSectionsSelector } from 'src/points/selectors'
import { getMockStoreData } from 'test/utils'

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
            swap: { pointsAmount: 10 },
            'create-wallet': { pointsAmount: 20 },
          },
        },
      },
    })
    const result = pointsSectionsSelector(stateWithPointsConfig)

    expect(result).toEqual([
      { points: 20, activities: [{ name: 'create-wallet' }] },
      { points: 10, activities: [{ name: 'swap' }] },
    ])
  })
})
