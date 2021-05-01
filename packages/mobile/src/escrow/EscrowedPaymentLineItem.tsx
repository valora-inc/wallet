import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { EscrowedPayment } from 'src/escrow/actions'
import { useEscrowPaymentRecipient } from 'src/escrow/utils'

interface Props {
  payment: EscrowedPayment
}

export default function EscrowedPaymentLineItem({ payment }: Props) {
  const { t } = useTranslation()
  const [displayName] = useEscrowPaymentRecipient(payment)

  // Using a fragment to suppress a limitation with TypeScript and functional
  // components returning a string
  // See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20544
  return <>{displayName || t('global:unknown').toLowerCase()}</>
}
