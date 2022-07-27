interface SentrySpanInfo {
  name: string
  op: string
}

export enum SentrySpan {
  fetch_balances = 'FetchBalances',
  import_contacts = 'ImportContacts',
  pincode_enter = 'PincodeEnter',
  pincode_set = 'PincodeSet',
  send_payment_or_invite = 'SendPaymentOrInvite',
  send_payment_or_invite_legacy = 'SendPaymentOrInviteLegacy',
}

type values = typeof SentrySpan[keyof typeof SentrySpan]

export const SentrySpans: Record<values, SentrySpanInfo> = {
  FetchBalances: {
    name: 'Fetch Balances',
    op: 'fetch_balances',
  },
  ImportContacts: {
    name: 'Import Contacts',
    op: 'import_contacts',
  },
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
