import { Props as ActivityCardProps } from 'src/points/ActivityCard'
import { compareAmountAndTitle } from 'src/points/cardSort'

describe('sortByAmountAndTitle', () => {
  test('sorts by points amount in decreasing order', () => {
    const activities = [
      { pointsAmount: 50 } as ActivityCardProps,
      { pointsAmount: 100 } as ActivityCardProps,
      { pointsAmount: 75 } as ActivityCardProps,
    ]
    activities.sort(compareAmountAndTitle)
    expect(activities).toEqual([{ pointsAmount: 100 }, { pointsAmount: 75 }, { pointsAmount: 50 }])
  })

  test('sorts by maximum increase from previous value when points amount is the same', () => {
    const activities = [
      { pointsAmount: 100, previousPointsAmount: 50 } as ActivityCardProps,
      { pointsAmount: 100, previousPointsAmount: 25 } as ActivityCardProps,
      { pointsAmount: 100, previousPointsAmount: 75 } as ActivityCardProps,
    ]
    activities.sort(compareAmountAndTitle)
    expect(activities).toEqual([
      { pointsAmount: 100, previousPointsAmount: 25 },
      { pointsAmount: 100, previousPointsAmount: 50 },
      { pointsAmount: 100, previousPointsAmount: 75 },
    ])
  })

  test('sorts alphabetically by title when points amount and increase are the same', () => {
    const activities = [
      { pointsAmount: 100, previousPointsAmount: 50, title: 'C' } as ActivityCardProps,
      { pointsAmount: 100, previousPointsAmount: 50, title: 'B' } as ActivityCardProps,
      { pointsAmount: 100, previousPointsAmount: 50, title: 'A' } as ActivityCardProps,
    ]
    activities.sort(compareAmountAndTitle)
    expect(activities).toEqual([
      { pointsAmount: 100, previousPointsAmount: 50, title: 'A' },
      { pointsAmount: 100, previousPointsAmount: 50, title: 'B' },
      { pointsAmount: 100, previousPointsAmount: 50, title: 'C' },
    ])
  })

  test('handles undefined values for previousPointsAmount', () => {
    const activities = [
      { pointsAmount: 75, previousPointsAmount: undefined } as ActivityCardProps,
      { pointsAmount: 100, previousPointsAmount: 50 } as ActivityCardProps,
      { pointsAmount: 0, previousPointsAmount: 0 } as ActivityCardProps,
      { pointsAmount: 100, previousPointsAmount: undefined } as ActivityCardProps,
    ]
    activities.sort(compareAmountAndTitle)
    expect(activities).toEqual([
      { pointsAmount: 100, previousPointsAmount: 50 },
      { pointsAmount: 100, previousPointsAmount: undefined },
      { pointsAmount: 75, previousPointsAmount: undefined },
      { pointsAmount: 0, previousPointsAmount: 0 },
    ])
  })
})
