import { isNil, noop } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'

import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'

import { useShareUrl } from './hooks'
import InviteModal from './InviteModal'

export default function Invite() {
  const { t } = useTranslation()
  const shareUrl = useShareUrl()

  return (
    <InviteModal
      title={t('inviteWithUrl.title')}
      description={t('inviteWithUrl.body')}
      buttonLabel={t('inviteWithUrl.button')}
      disabled={isNil(shareUrl)}
      onClose={navigateBack}
      onShareInvite={shareUrl ?? noop}
    />
  )
}

Invite.navOptions = noHeader
