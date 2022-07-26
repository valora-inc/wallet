interface SentrySpanInfo {
  name: string
  op: string
}

export enum SentrySpan {
  send_payment_or_invite = 'SendPaymentOrInvite',
  send_payment_or_invite_legacy = 'SendPaymentOrInviteLegacy',
  pincode_enter = 'PincodeEnter',
  pincode_set = 'PincodeSet',
}

type values = typeof SentrySpan[keyof typeof SentrySpan]

export const SentrySpans: Record<values, SentrySpanInfo> = {
  SendPaymentOrInvite: {
    name: 'Send Payment or Invite',
    op: 'send_payment_or_invite',
  },
  SendPaymentOrInviteLegacy: {
    name: 'Send Payment or Invite (legacy)',
    op: 'send_payment_or_invite_legacy',
  },
  PincodeEnter: {
    name: 'Pincode Enter',
    op: 'pincode_enter',
  },
  PincodeSet: {
    name: 'Pincode Set',
    op: 'pincode_set',
  },
}
