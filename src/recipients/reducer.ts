import { createAction, createReducer, createSelector } from '@reduxjs/toolkit'
import { addressToDisplayNameSelector, addressToE164NumberSelector } from 'src/identity/selectors'
import { AddressToRecipient, NumberToRecipient } from 'src/recipients/recipient'
import { REHYDRATE, RehydrateAction, getRehydratePayload } from 'src/redux/persist-helper'
import { RootState } from 'src/redux/reducers'

interface State {
  // phoneRecipientCache contains the processed contact data imported from the
  // phone for a single app session.
  // Think of contacts as raw data and recipients as filtered data
  // No relation to recent recipients, which is in /send/reducer.ts
  phoneRecipientCache: NumberToRecipient
  // valoraRecipientCache contains accounts that the user has sent/recieved transactions from,
  // and includes CIP8 profile data if available
  valoraRecipientCache: AddressToRecipient
  rewardsSenders: string[]
  inviteRewardsSenders: string[]
  coinbasePaySenders: string[]
}

const initialState: State = {
  phoneRecipientCache: {},
  valoraRecipientCache: {},
  rewardsSenders: [],
  inviteRewardsSenders: [],
  coinbasePaySenders: [],
}

const rehydrate = createAction<any>(REHYDRATE)
export const setPhoneRecipientCache = createAction<NumberToRecipient>(
  'RECIPIENTS/SET_PHONE_RECIPIENT_CACHE'
)
export const updateValoraRecipientCache = createAction<AddressToRecipient>(
  'RECIPIENTS/SET_VALORA_RECIPIENT_CACHE'
)
export const rewardsSendersFetched = createAction<string[]>('RECIPIENTS/REWARDS_SENDERS_FETCHED')
export const inviteRewardsSendersFetched = createAction<string[]>(
  'RECIPIENTS/INVITE_REWARDS_SENDERS_FETCHED'
)
export const coinbasePaySendersFetched = createAction<string[]>(
  'RECIPIENTS/COINBASE_PAY_SENDERS_FETCHED'
)

export const recipientsReducer = createReducer(initialState, (builder) => {
  builder
    .addCase(rehydrate, (state, action) => {
      // hack to allow rehydrate actions here
      const hydrated = getRehydratePayload(action as unknown as RehydrateAction, 'recipients')
      return {
        ...initialState,
        ...state,
        ...hydrated,
      }
    })
    .addCase(setPhoneRecipientCache, (state, action) => ({
      ...state,
      phoneRecipientCache: action.payload,
    }))
    .addCase(updateValoraRecipientCache, (state, action) => ({
      ...state,
      valoraRecipientCache: { ...state.valoraRecipientCache, ...action.payload },
    }))
    .addCase(rewardsSendersFetched, (state, action) => ({
      ...state,
      rewardsSenders: action.payload,
    }))
    .addCase(inviteRewardsSendersFetched, (state, action) => ({
      ...state,
      inviteRewardsSenders: action.payload,
    }))
    .addCase(coinbasePaySendersFetched, (state, action) => ({
      ...state,
      coinbasePaySenders: action.payload,
    }))
})

export const phoneRecipientCacheSelector = (state: RootState) =>
  state.recipients.phoneRecipientCache
export const valoraRecipientCacheSelector = (state: RootState) =>
  state.recipients.valoraRecipientCache
export const rewardsSendersSelector = (state: RootState) => state.recipients.rewardsSenders
export const inviteRewardsSendersSelector = (state: RootState) =>
  state.recipients.inviteRewardsSenders

export const allRewardsSendersSelector = createSelector(
  [rewardsSendersSelector, inviteRewardsSendersSelector],
  (rewardsSenders, inviteRewardsSenders) => {
    return [...rewardsSenders, ...inviteRewardsSenders]
  }
)
export const coinbasePaySendersSelector = (state: RootState) => state.recipients.coinbasePaySenders

export const recipientInfoSelector = createSelector(
  [
    addressToE164NumberSelector,
    phoneRecipientCacheSelector,
    valoraRecipientCacheSelector,
    addressToDisplayNameSelector,
  ],
  (addressToE164Number, phoneRecipientCache, valoraRecipientCache, addressToDisplayName) => {
    return {
      addressToE164Number,
      phoneRecipientCache,
      valoraRecipientCache,
      addressToDisplayName,
    }
  }
)
