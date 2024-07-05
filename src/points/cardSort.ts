import { Props as ActivityCardProps } from 'src/points/ActivityCard'

export function compareAmountAndTitle(a: ActivityCardProps, b: ActivityCardProps) {
  // sort by decreasing points amount
  if (b.pointsAmount !== a.pointsAmount) {
    return b.pointsAmount - a.pointsAmount
  }

  // within the same points amount, promote the maximum increase from previous value
  const diffA = a.pointsAmount - (a.previousPointsAmount ?? Infinity)
  const diffB = b.pointsAmount - (b.previousPointsAmount ?? Infinity)
  if (diffB !== diffA) {
    return diffB - diffA
  }

  // finally, sort alphabetically
  return a.title.localeCompare(b.title)
}
