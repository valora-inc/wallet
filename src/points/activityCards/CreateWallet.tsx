import React from 'react'
import ActivityCard from 'src/points/activityCards'
import Celebration from 'src/icons/Celebration'
import { useTranslation } from 'react-i18next'

export default function CreateWallet() {
  const { t } = useTranslation()
  return (
    <ActivityCard
      completed={true}
      icon={<Celebration />}
      title={t('points.activityCards.createWallet.title')}
      pressable={false}
    />
  )
}
