import React from 'react'
import ActivityCard from 'src/points/activityCards'
import Rocket from 'src/icons/Rocket'
import { useTranslation } from 'react-i18next'
import { ActivityCardProps } from 'src/points/types'

export default function MoreComing(props: ActivityCardProps) {
  const { t } = useTranslation()
  return (
    <ActivityCard
      completed={false}
      icon={<Rocket />}
      title={t('points.activityCards.moreComing.title')}
    />
  )
}
