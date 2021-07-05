export const SENTINEL_INVITE_COMMENT = '__CELO_INVITE_TX__'

export enum Actions {
  STORE_INVITEE_DATA = 'INVITE/STORE_INVITEE_DATA',
}

export interface InviteDetails {
  timestamp: number
  e164Number: string
  tempWalletAddress: string
  tempWalletPrivateKey: string
  tempWalletRedeemed: boolean
  inviteCode: string
  inviteLink: string
}

export interface StoreInviteeDataAction {
  type: Actions.STORE_INVITEE_DATA
  inviteDetails: InviteDetails
}

export const storeInviteeData = (inviteDetails: InviteDetails): StoreInviteeDataAction => ({
  type: Actions.STORE_INVITEE_DATA,
  inviteDetails,
})

export type ActionTypes = StoreInviteeDataAction
