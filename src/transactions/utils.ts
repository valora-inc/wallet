import i18n from 'src/i18n'
import { formatFeedSectionTitle, timeDeltaInDays } from 'src/utils/time'

// Groupings:
// Recent -> Last 7 days (pending transactions always at the top, followed by recent confirmed transactions).
// [Current month] - "July" -> Captures transactions from the current month that aren’t captured in Recent.
// [Previous months] - "June" -> Captures transactions by month.
// [Months over a year ago] — "July 2019" -> Same as above, but with year appended.
// Sections are hidden if they have no items.
export function groupFeedItemsInSections<T extends { timestamp: number }>(
  pendingTransactions: T[],
  confirmedTransactions: T[]
) {
  const sectionsMap: {
    [key: string]: {
      data: T[]
      daysSinceTransaction: number
    }
  } = {}

  // add standby transactions to top of recent section
  const recentSectionTitle = i18n.t('feedSectionHeaderRecent')
  if (pendingTransactions.length > 0) {
    sectionsMap[recentSectionTitle] = {
      daysSinceTransaction: 0,
      data: pendingTransactions,
    }
  }

  confirmedTransactions.forEach((transaction) => {
    const daysSinceTransaction = timeDeltaInDays(Date.now(), transaction.timestamp)
    const sectionTitle =
      daysSinceTransaction <= 7
        ? i18n.t('feedSectionHeaderRecent')
        : formatFeedSectionTitle(transaction.timestamp, i18n)
    sectionsMap[sectionTitle] = {
      daysSinceTransaction: sectionsMap[sectionTitle]?.daysSinceTransaction ?? daysSinceTransaction,
      data: [...(sectionsMap[sectionTitle]?.data ?? []), transaction],
    }
  })

  return Object.entries(sectionsMap)
    .sort((a, b) => a[1].daysSinceTransaction - b[1].daysSinceTransaction)
    .map(([key, value]) => ({
      title: key,
      data: value.data,
    }))
}
