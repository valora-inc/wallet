import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import AggregatedRequestsMessagingCard from 'src/components/AggregatedRequestsMessagingCard'

interface Props<T> {
  title: string
  detailsI18nKey: string
  icon: React.ReactNode
  onReview: () => void
  itemRenderer: (item: T, key: number) => React.ReactElement
  items: T[]
}

// If changing this, you probably also need to update the translation files
// which use it via detailsI18nKey
const PREVIEW_SIZE = 2

function getContext(count: number) {
  if (count === 2) {
    return 'exactly2Items'
  }
  if (count === 3) {
    return 'exactly3Items'
  }

  return 'moreThan3Items'
}

// Summary notification for the notification center on home screen
export default function SummaryNotification<T>(props: Props<T>) {
  const { t } = useTranslation()
  const { items, title, detailsI18nKey, icon, onReview, itemRenderer } = props

  return (
    <AggregatedRequestsMessagingCard
      title={title}
      details={
        <Trans
          i18nKey={detailsI18nKey}
          components={items.slice(0, PREVIEW_SIZE).map(itemRenderer)}
          context={getContext(items.length)}
        />
      }
      icon={icon}
      callToActions={[
        {
          text: t('viewAll'),
          onPress: onReview,
        },
      ]}
    />
  )
}
