interface SentryTransactionInfo {
  name: string
  op: string
}

export enum SentryTransaction {
  fetch_balances = 'FetchBalances',
  fetch_positions = 'FetchPositions',
  import_contacts = 'ImportContacts',
  pincode_enter = 'PincodeEnter',
  pincode_set = 'PincodeSet',
  send_payment = 'SendPayment',
  wallet_connect_connection = 'WalletConnectConnection',
  wallet_connect_transaction = 'WalletConnectTransaction',
  app_init_saga = 'AppInitSaga',
}

type values = (typeof SentryTransaction)[keyof typeof SentryTransaction]

export const SentryTransactions: Record<values, SentryTransactionInfo> = {
  FetchBalances: {
    name: 'Fetch Balances',
    op: 'fetch_balances',
  },
  FetchPositions: {
    name: 'Fetch Positions',
    op: 'fetch_positions',
  },
  ImportContacts: {
    name: 'Import Contacts',
    op: 'import_contacts',
  },
  SendPayment: {
    name: 'Send Payment',
    op: 'send_payment',
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
  AppInitSaga: {
    name: 'App Init Saga',
    op: 'app_init_saga',
  },
}
