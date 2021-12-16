import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import TransferAvatars from 'src/transactions/TransferAvatars'
import { TokenTransfer } from 'src/transactions/types'
import UserSection from 'src/transactions/UserSection'

function RewardReceivedContent({ transfer }: { transfer: TokenTransfer }) {
  const { amount, metadata, address } = transfer

  const { t } = useTranslation()
  const info = useSelector(recipientInfoSelector)
  const recipient = getRecipientFromAddress(address, info, metadata.title, metadata.image)

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
      />
      <TouchableOpacity onPress={openLearnMore} testID={'celoRewards/learnMore'}>
        <Text style={styles.learnMore}>{t('learnMore')}</Text>
      </TouchableOpacity>
      <HorizontalLine />
      <TokenTotalLineItem
        tokenAmount={new BigNumber(amount.value)}
        tokenAddress={amount.tokenAddress}
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
