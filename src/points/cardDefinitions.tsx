import React from 'react'
import { PointsActivityId, PointsCardMetadata } from 'src/points/types'
import Celebration from 'src/icons/Celebration'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Rocket from 'src/icons/Rocket'
import { useTranslation } from 'react-i18next'

export default function useCardDefinitions(
  pointsValue: number
): Record<PointsActivityId, PointsCardMetadata> {
  const { t } = useTranslation()

  return {
    'create-wallet': {
      title: t('points.activityCards.createWallet.title'),
      icon: <Celebration />,
      defaultCompletionStatus: true,
    },
    swap: {
      title: t('points.activityCards.swap.title'),
      icon: <SwapArrows />,
      defaultCompletionStatus: false,
      bottomSheet: {
        title: t('points.activityCards.swap.bottomSheet.title'),
        body: t('points.activityCards.swap.bottomSheet.body', { pointsValue }),
        cta: {
          text: t('points.activityCards.swap.bottomSheet.cta'),
          onPress: () => {
            navigate(Screens.SwapScreenWithBack)
          },
        },
      },
    },
    'more-coming': {
      title: t('points.activityCards.moreComing.title'),
      icon: <Rocket />,
      defaultCompletionStatus: false,
    },
  }
}
