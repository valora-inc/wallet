import React from 'react'
import ActivityCard from 'src/points/activityCards'
import Rocket from 'src/icons/Rocket'
import { useTranslation } from 'react-i18next'

export default function MoreComing() {
  const { t } = useTranslation()
  return (
    <ActivityCard
      completed={false}
      icon={<Rocket />}
      title={t('points.activityCards.moreComing.title')}
      pressable={false}
    />
  )
}
