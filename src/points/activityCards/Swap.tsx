import React from 'react'
import ActivityCard from 'src/points/activityCards'
import SwapArrows from 'src/icons/SwapArrows'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

export default function Swap() {
  const { t } = useTranslation()
  // TODO: Finalize designs throughout this card
  const onCtaPress = () => {
    navigate(Screens.SwapScreenWithBack)
  }

  return (
    <ActivityCard
      completed={false}
      icon={<SwapArrows />}
      title={t('points.activityCards.swap.title')}
      pressable={true}
      bottomSheetTitle={t('points.activityCards.swap.bottomSheet.title')}
      bottomSheetBody={t('points.activityCards.swap.bottomSheet.body')}
      bottomSheetCta={t('points.activityCards.swap.bottomSheet.cta')}
      onCtaPress={onCtaPress}
    />
  )
}
