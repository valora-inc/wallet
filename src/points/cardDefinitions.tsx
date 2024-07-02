import React from 'react'
import {
  PointsActivityId,
  PointsCardMetadata,
  ClaimHistoryCardItem,
  CreateLiveLinkClaimHistory,
} from 'src/points/types'
import Celebration from 'src/icons/Celebration'
import SwapArrows from 'src/icons/SwapArrows'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import Rocket from 'src/icons/Rocket'
import MagicWand from 'src/icons/MagicWand'
import { useTranslation } from 'react-i18next'
import colors from 'src/styles/colors'
import { getSupportedNetworkIdsForSwap } from 'src/tokens/utils'
import { useSelector } from 'src/redux/hooks'
import { tokensByIdSelector } from 'src/tokens/selectors'
import Logger from 'src/utils/Logger'
import { TokenBalances } from 'src/tokens/slice'
import { TFunction } from 'i18next'

const TAG = 'Points/cardDefinitions'

export interface HistoryCardMetadata {
  icon: React.ReactNode
  title: string
  subtitle: string
  pointsAmount: number
}

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
    'create-live-link': {
      title: t('points.activityCards.createLiveLink.title'),
      icon: <MagicWand color={colors.black} />,
      defaultCompletionStatus: false,
      bottomSheet: {
        title: t('points.activityCards.createLiveLink.bottomSheet.title'),
        body: t('points.activityCards.createLiveLink.bottomSheet.body', { pointsValue }),
        cta: {
          text: t('points.activityCards.createLiveLink.bottomSheet.cta'),
          onPress: () => {
            navigate(Screens.JumpstartEnterAmount)
          },
        },
      },
    },
  }
}

function getCreateLiveLinkHistorySubtitle(
  history: Omit<CreateLiveLinkClaimHistory, 'createdAt'>,
  tokensById: TokenBalances,
  t: TFunction
): string | undefined {
  const liveLinkType = history.metadata.liveLinkType
  switch (liveLinkType) {
    case 'erc20': {
      const token = tokensById[history.metadata.tokenId]
      if (!token) {
        Logger.error(TAG, `Cannot find token ${history.metadata.tokenId}`)
        return
      }
      return t('points.history.cards.createLiveLink.subtitle.erc20', { tokenSymbol: token.symbol })
    }
    case 'erc721': {
      return t('points.history.cards.createLiveLink.subtitle.erc721')
    }
    default: {
      const exhaustiveCheck: never = liveLinkType
      return exhaustiveCheck
    }
  }
}

export function useGetHistoryDefinition(): (
  history: ClaimHistoryCardItem
) => HistoryCardMetadata | undefined {
  const { t } = useTranslation()
  const tokensById = useSelector((state) =>
    tokensByIdSelector(state, getSupportedNetworkIdsForSwap())
  )

  return (history: ClaimHistoryCardItem) => {
    switch (history.activityId) {
      case 'create-wallet': {
        return {
          icon: <Celebration color={colors.successDark} />,
          title: t('points.history.cards.createWallet.title'),
          subtitle: t('points.history.cards.createWallet.subtitle'),
          pointsAmount: history.pointsAmount,
        }
      }
      case 'swap': {
        const fromToken = tokensById[history.metadata.from]
        const toToken = tokensById[history.metadata.to]
        if (!fromToken || !toToken) {
          Logger.error(TAG, `Cannot find tokens ${history.metadata.from} or ${history.metadata.to}`)
          return undefined
        }
        return {
          icon: <SwapArrows color={colors.successDark} />,
          title: t('points.history.cards.swap.title'),
          subtitle: t('points.history.cards.swap.subtitle', {
            fromToken: fromToken.symbol,
            toToken: toToken.symbol,
          }),
          pointsAmount: history.pointsAmount,
        }
      }
      case 'create-live-link': {
        const subtitle = getCreateLiveLinkHistorySubtitle(history, tokensById, t)
        if (!subtitle) {
          Logger.error(TAG, `Cannot generate subtitle, skipping`)
          return
        }
        return {
          icon: <MagicWand />,
          title: t('points.history.cards.createLiveLink.title'),
          subtitle,
          pointsAmount: history.pointsAmount,
        }
      }
      default: {
        const _exhaustiveCheck: never = history
        return _exhaustiveCheck
      }
    }
  }
}
