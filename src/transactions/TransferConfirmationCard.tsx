import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { RewardsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { MoneyAmount, TokenTransactionType } from 'src/apollo/types'
import { rewardsEnabledSelector } from 'src/app/selectors'
import { CELO_REWARDS_LINK } from 'src/brandingConfig'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import HorizontalLine from 'src/components/HorizontalLine'
import LineItemRow from 'src/components/LineItemRow'
import Link from 'src/components/Link'
import TotalLineItem from 'src/components/TotalLineItem'
import { FAQ_LINK } from 'src/config'
import { RewardsScreenOrigin } from 'src/consumerIncentives/analyticsEventsTracker'
import { addressToDisplayNameSelector } from 'src/identity/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Recipient } from 'src/recipients/recipient'
import { rewardsSendersSelector } from 'src/recipients/reducer'
import useTypedSelector from 'src/redux/useSelector'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import BottomText from 'src/transactions/BottomText'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import { Currency } from 'src/utils/currencies'
import { navigateToURI } from 'src/utils/linking'

// DIEGO: I think we can remove address and phone number from here, since we have that info in recipient.
export interface TransferConfirmationCardProps {
  address?: string
  comment?: string | null
  amount: MoneyAmount
  type: TokenTransactionType
  e164PhoneNumber?: string
  dollarBalance?: BigNumber
  recipient: Recipient
}

type Props = TransferConfirmationCardProps & {
  addressHasChanged: boolean
}

const onPressGoToFaq = () => {
  navigateToURI(FAQ_LINK)
}

function FaucetContent({ amount }: Props) {
  const { t } = useTranslation()
  const totalAmount = amount

  return (
    <>
      <TotalLineItem amount={totalAmount} />
      <BottomText>{t('receivedAmountFromCelo')}</BottomText>
    </>
  )
}

function VerificationContent({ amount }: Props) {
  const { t } = useTranslation()
  const totalAmount = amount

  return (
    <>
      <TotalLineItem amount={totalAmount} hideSign={true} />
      <BottomText>{t('verificationMessage')}</BottomText>
    </>
  )
}

function InviteSentContent({ addressHasChanged, recipient, amount }: Props) {
  const { t } = useTranslation()
  const totalAmount = amount
  // TODO: Use real fee
  const totalFee = new BigNumber(0)

  return (
    <>
      <UserSection
        type="sent"
        addressHasChanged={addressHasChanged}
        recipient={recipient}
        avatar={<ContactCircle recipient={recipient} />}
      />
      <HorizontalLine />
      <FeeDrawer
        currency={amount.currencyCode as Currency}
        securityFee={totalFee}
        totalFee={totalFee}
      />
      <TotalLineItem amount={totalAmount} hideSign={true} />
      <BottomText>{t('whySendFees')}</BottomText>
    </>
  )
}

function InviteReceivedContent({ addressHasChanged, recipient, amount }: Props) {
  const { t } = useTranslation()
  const totalAmount = amount

  return (
    <>
      <UserSection
        type="received"
        addressHasChanged={addressHasChanged}
        recipient={recipient}
        avatar={<ContactCircle recipient={recipient} />}
      />
      <HorizontalLine />
      <TotalLineItem amount={totalAmount} />
      <BottomText>{t('whyReceiveFees')}</BottomText>
    </>
  )
}

function NetworkFeeContent({ amount }: Props) {
  const { t } = useTranslation()
  const totalAmount = amount

  return (
    <>
      <TotalLineItem amount={totalAmount} hideSign={true} />
      <BottomText>
        {t('networkFeeExplanation.0')}
        <Link onPress={onPressGoToFaq}>{t('networkFeeExplanation.1')}</Link>
      </BottomText>
    </>
  )
}

function PaymentSentContent({ addressHasChanged, recipient, amount, comment }: Props) {
  const { t } = useTranslation()
  const sentAmount = amount
  // TODO: Use real fee
  const securityFee = new BigNumber(0)
  const totalAmount = amount
  const totalFee = securityFee

  const isCeloWithdrawal = amount.currencyCode === Currency.Celo

  return (
    <>
      <UserSection
        type={isCeloWithdrawal ? 'withdrawn' : 'sent'}
        addressHasChanged={addressHasChanged}
        recipient={recipient}
        avatar={<TransferAvatars type="sent" recipient={recipient} />}
      />
      <CommentSection comment={comment} />
      <HorizontalLine />
      <LineItemRow
        title={t(isCeloWithdrawal ? 'amountCeloWithdrawn' : 'amountSent')}
        amount={<CurrencyDisplay amount={sentAmount} hideSign={true} />}
      />
      <FeeDrawer
        currency={amount.currencyCode as Currency}
        securityFee={securityFee}
        totalFee={totalFee}
      />
      <TotalLineItem amount={totalAmount} hideSign={true} />
    </>
  )
}

function PaymentReceivedContent({ address, recipient, e164PhoneNumber, amount, comment }: Props) {
  const { t } = useTranslation()
  const totalAmount = amount
  const isCeloTx = amount.currencyCode === Currency.Celo
  const celoEducationUri = useTypedSelector((state) => state.app.celoEducationUri)

  const openLearnMore = () => {
    navigate(Screens.WebViewScreen, { uri: celoEducationUri! })
  }

  return (
    <>
      <UserSection
        type="received"
        recipient={recipient}
        avatar={<TransferAvatars type="received" recipient={recipient} />}
      />
      <CommentSection comment={comment} />
      {isCeloTx && celoEducationUri && (
        <TouchableOpacity onPress={openLearnMore} testID={'celoTxReceived/learnMore'}>
          <Text style={styles.learnMore}>{t('learnMore')}</Text>
        </TouchableOpacity>
      )}
      <HorizontalLine />
      <TotalLineItem amount={totalAmount} />
    </>
  )
}

function RewardContent({ amount, recipient }: Props) {
  const { t } = useTranslation()
  const rewardsEnabled = useTypedSelector(rewardsEnabledSelector)

  const openLearnMore = () => {
    if (rewardsEnabled) {
      navigate(Screens.ConsumerIncentivesHomeScreen)
      ValoraAnalytics.track(RewardsEvents.rewards_screen_opened, {
        origin: RewardsScreenOrigin.PaymentDetail,
      })
    } else {
      navigateToURI(CELO_REWARDS_LINK)
    }
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
      <TotalLineItem amount={amount} />
    </>
  )
}

// Differs from TransferReviewCard which is used during Send flow, this is for completed txs
export default function TransferConfirmationCard(props: Props) {
  const addressToDisplayName = useSelector(addressToDisplayNameSelector)
  const rewardsSenders = useSelector(rewardsSendersSelector)
  let content

  switch (props.type) {
    case TokenTransactionType.Faucet:
      content = <FaucetContent {...props} />
      break
    case TokenTransactionType.VerificationFee:
      content = <VerificationContent {...props} />
      break
    case TokenTransactionType.InviteSent:
      content = <InviteSentContent {...props} />
      break
    case TokenTransactionType.InviteReceived:
      content = <InviteReceivedContent {...props} />
      break
    case TokenTransactionType.NetworkFee:
      content = <NetworkFeeContent {...props} />
      break
    case TokenTransactionType.EscrowSent:
    case TokenTransactionType.Sent:
      content = <PaymentSentContent {...props} />
      break
    case TokenTransactionType.EscrowReceived:
    case TokenTransactionType.Received:
      const address = props.address ?? ''
      const isRewardSender =
        rewardsSenders.includes(address) || addressToDisplayName[address]?.isCeloRewardSender
      content = isRewardSender ? (
        <RewardContent {...props} />
      ) : (
        <PaymentReceivedContent {...props} />
      )
      break
  }

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <SafeAreaView style={styles.content}>{content}</SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
  learnMore: {
    ...fontStyles.small,
    color: colors.gray4,
    textDecorationLine: 'underline',
  },
})
