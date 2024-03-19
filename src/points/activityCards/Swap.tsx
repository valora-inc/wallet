import React from 'react'
import ActivityCard from 'src/points/activityCards'
import SwapArrows from 'src/icons/SwapArrows'
import { useTranslation } from 'react-i18next'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { ActivityCardProps } from 'src/points/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { PointsEvents } from 'src/analytics/Events'

export default function Swap({ points, onPress }: ActivityCardProps) {
  const { t } = useTranslation()

  // TODO: Finalize designs throughout this card
  const onCtaPress = () => {
    ValoraAnalytics.track(PointsEvents.points_swap_cta_press)
    navigate(Screens.SwapScreenWithBack)
  }
  const onCardPress = () => {
    ValoraAnalytics.track(PointsEvents.points_swap_card_press)
    onPress({
      points,
      bottomSheetTitle: t('points.activityCards.swap.bottomSheet.title'),
      bottomSheetBody: t('points.activityCards.swap.bottomSheet.body'),
      bottomSheetCta: t('points.activityCards.swap.bottomSheet.cta'),
      onCtaPress,
    })
  }

  return (
    <ActivityCard
      completed={false}
      icon={<SwapArrows />}
      title={t('points.activityCards.swap.title')}
      onCardPress={onCardPress}
    />
  )
}
