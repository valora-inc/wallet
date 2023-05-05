import i18n from 'src/i18n'
import { formatFeedSectionTitle, timeDeltaInDays } from 'src/utils/time'

// Groupings:
// Recent -> Last 7 days.
// [Current month] - "July" -> Captures transactions from the current month that aren’t captured in Recent.
// [Previous months] - "June" -> Captures transactions by month.
// [Months over a year ago] — "July 2019" -> Same as above, but with year appended.
// Sections are hidden if they have no items.
export function groupFeedItemsInSections<T extends { timestamp: number }>(items: T[]) {
  const sectionsMap: {
    [key: string]: {
      data: T[]
      daysSinceTransaction: number
    }
  } = {}

  items.reduce((sections, item) => {
    const daysSinceTransaction = timeDeltaInDays(Date.now(), item.timestamp)
    const key =
      daysSinceTransaction <= 7
        ? i18n.t('feedSectionHeaderRecent')
        : formatFeedSectionTitle(item.timestamp, i18n)
    sections[key] = sections[key] || {
      daysSinceTransaction,
      data: [],
    }
    sections[key].data.push(item)
    return sections
  }, sectionsMap)

  return Object.entries(sectionsMap)
    .sort((a, b) => a[1].daysSinceTransaction - b[1].daysSinceTransaction)
    .map(([key, value]) => ({
      title: key,
      data: value.data,
    }))
}
