interface SentryTransactionInfo {
  name: string
  op: string
}

export enum SentryTransaction {
  dappkit_connection = 'DAppKitConnection',
  dappkit_transaction = 'DAppKitTransaction',
  fetch_balances = 'FetchBalances',
  import_contacts = 'ImportContacts',
  pincode_enter = 'PincodeEnter',
  pincode_set = 'PincodeSet',
  send_payment_or_invite = 'SendPaymentOrInvite',
  send_payment_or_invite_legacy = 'SendPaymentOrInviteLegacy',
  wallet_connect_connection = 'WalletConnectConnection',
  wallet_connect_transaction = 'WalletConnectTransaction',
}

type values = typeof SentryTransaction[keyof typeof SentryTransaction]

export const SentryTransactions: Record<values, SentryTransactionInfo> = {
  DAppKitConnection: {
    name: 'DAppKit Connection',
    op: 'dappkit_connection',
  },
  DAppKitTransaction: {
    name: 'DAppKit Transaction',
    op: 'dappkit_transaction',
  },
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
  WalletConnectConnection: {
    name: 'Wallet Connect Connection',
    op: 'wallet_connect_connection',
  },
  WalletConnectTransaction: {
    name: 'Wallet Connect Transaction',
    op: 'wallet_connect_transaction',
  },
}
