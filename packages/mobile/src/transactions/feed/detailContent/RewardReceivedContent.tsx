import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import HorizontalLine from 'src/components/HorizontalLine'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { CELO_LOGO_URL } from 'src/config'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import TransferAvatars from 'src/transactions/TransferAvatars'
import { TokenTransfer } from 'src/transactions/types'
import UserSection from 'src/transactions/UserSection'

// Note that this is tested from TransactionDetailsScreen.test.tsx
function RewardReceivedContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address } = transfer

  const { t } = useTranslation()
  const recipient = {
    address,
    name: metadata.title ?? t('feedItemRewardReceivedTitle'),
    thumbnailPath: metadata.image ?? CELO_LOGO_URL,
  }

  const openLearnMore = () => {
    navigate(Screens.ConsumerIncentivesHomeScreen)
    ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
      origin: RewardsScreenOrigin.PaymentDetail,
    })
  }

  return (
    <>
      <UserSection
        type="received"
        expandable={false}
        recipient={recipient}
        avatar={<TransferAvatars type="received" recipient={recipient} />}
        testID="RewardReceived"
      />
      <TouchableOpacity onPress={openLearnMore} testID={'celoRewards/learnMore'}>
        <Text style={styles.learnMore}>{t('learnMore')}</Text>
      </TouchableOpacity>
      <HorizontalLine />
      <TokenTotalLineItem
        tokenAmount={new BigNumber(amount.value)}
        tokenAddress={amount.tokenAddress}
        localAmount={amount.localAmount}
        feeToAddInUsd={undefined}
        hideSign={true}
      />
    </>
  )
}

const styles = StyleSheet.create({
  learnMore: {
    ...fontStyles.small,
    color: colors.gray4,
    textDecorationLine: 'underline',
  },
})

export default RewardReceivedContent
