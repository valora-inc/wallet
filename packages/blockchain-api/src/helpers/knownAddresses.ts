import { database } from '../firebase'

function errorLogger(error: any) {
  console.error('Firebase read failed:', error)
}

export interface KnownAddressInfo {
  name: string
  imageUrl?: string
}

export interface AddressToDisplayNameType {
  [address: string]: KnownAddressInfo | undefined
}

let inviteRewardAddresses: string[] = []
let balanceRewardAddresses: string[] = []
let knownAddresses: AddressToDisplayNameType = {}

database.ref('inviteRewardAddresses').on(
  'value',
  (snapshot: any) => {
    inviteRewardAddresses = (snapshot && snapshot.val()) || []
  },
  errorLogger
)

database.ref('balanceRewardAddresses').on(
  'value',
  (snapshot: any) => {
    balanceRewardAddresses = (snapshot && snapshot.val()) || []
  },
  errorLogger
)

database.ref('addressesExtraInfo').on(
  'value',
  (snapshot: any) => {
    knownAddresses = (snapshot && snapshot.val()) || {}
  },
  errorLogger
)

export function knownAddressesFields(address: string) {
  const isBalanceReward = balanceRewardAddresses.includes(address)
  const isInviteReward = inviteRewardAddresses.includes(address)
  const addressInfo = knownAddresses[address]
  return {
    isBalanceReward,
    isInviteReward,
    name: addressInfo?.name,
    imageUrl: addressInfo?.imageUrl,
  }
}
