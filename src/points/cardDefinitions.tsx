import React from 'react'
import { PointsActivities, PointsCardMetadata } from 'src/points/types'
import Celebration from 'src/icons/Celebration'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Rocket from 'src/icons/Rocket'

const cardDefinitions: Record<PointsActivities, PointsCardMetadata> = {
  'create-wallet': {
    title: 'points.activityCards.createWallet.title',
    icon: <Celebration />,
    defaultCompletionStatus: true,
  },
  swap: {
    title: 'points.activityCards.swap.title',
    icon: <SwapArrows />,
    defaultCompletionStatus: false,
    bottomSheet: {
      title: 'points.activityCards.swap.bottomSheet.title',
      body: 'points.activityCards.swap.bottomSheet.body',
      cta: {
        text: 'points.activityCards.swap.bottomSheet.cta',
        onPress: () => {
          navigate(Screens.SwapScreenWithBack)
        },
      },
    },
  },
  'more-coming': {
    title: 'points.activityCards.moreComing.title',
    icon: <Rocket />,
    defaultCompletionStatus: false,
  },
}

export default cardDefinitions
