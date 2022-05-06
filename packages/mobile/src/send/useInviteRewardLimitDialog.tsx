import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import Dialog from 'src/components/Dialog'
import { MAX_NUM_INVITES_WITH_REWARDS } from 'src/config'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import {
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { Recipient } from 'src/recipients/recipient'
import { inviteRewardsActiveSelector, invitesWithRewardsSentSelector } from 'src/send/selectors'

const useInviteRewardLimitDialog = (onNavigateSendAmount: (recipient: Recipient) => void) => {
  const [invitee, setInvitee] = useState<Recipient | null>(null)

  const invitesWithRewardsSent = useSelector(invitesWithRewardsSentSelector)
  const inviteRewardsEnabled = useSelector(inviteRewardsActiveSelector)
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)

  const { t } = useTranslation()

  const handleClose = () => {
    setInvitee(null)
  }

  const handleInvite = () => {
    if (invitee) {
      onNavigateSendAmount(invitee)
      setInvitee(null)
    }
  }

  const onProceedSelectRecipient = (recipient: Recipient) => {
    if (inviteRewardsEnabled && !recipient.address && recipient.e164PhoneNumber) {
      const recipientAddress = getAddressFromPhoneNumber(
        recipient.e164PhoneNumber,
        e164NumberToAddress,
        secureSendPhoneNumberMapping,
        undefined
      )
      const isInvite = !recipientAddress
      const hasReachedRewardLimit = invitesWithRewardsSent === MAX_NUM_INVITES_WITH_REWARDS

      if (isInvite && hasReachedRewardLimit) {
        setInvitee(recipient)
        return
      }
    }

    onNavigateSendAmount(recipient)
  }

  const InviteRewardLimitDialog = invitee ? (
    <Dialog
      title={t('inviteLimitDialog.title')}
      isVisible={!!invitee}
      actionText={t('inviteLimitDialog.button')}
      actionPress={handleInvite}
      secondaryActionText={t('inviteLimitDialog.dismiss')}
      secondaryActionPress={handleClose}
    >
      {t('inviteLimitDialog.body')}
    </Dialog>
  ) : null

  return {
    InviteRewardLimitDialog,
    onProceedSelectRecipient,
  }
}

export default useInviteRewardLimitDialog
