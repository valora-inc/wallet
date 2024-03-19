import React from 'react'
import ActivityCard from 'src/points/activityCards'
import Celebration from 'src/icons/Celebration'
import { useTranslation } from 'react-i18next'
import { ActivityCardProps } from 'src/points/types'

export default function CreateWallet(props: ActivityCardProps) {
  const { t } = useTranslation()
  return (
    <ActivityCard
      completed={true}
      icon={<Celebration />}
      title={t('points.activityCards.createWallet.title')}
    />
  )
}
