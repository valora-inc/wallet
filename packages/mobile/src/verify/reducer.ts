import { Address } from '@celo/base'
import { ActionableAttestation } from '@celo/contractkit/lib/wrappers/Attestations'
import { AttestationsStatus } from '@celo/utils/lib/attestations'
import { createAction, createReducer, createSelector } from '@reduxjs/toolkit'
import _ from 'lodash'
import { RootState } from 'src/redux/reducers'

import { isBalanceSufficientForSigRetrieval } from '@celo/identity/lib/odis/phone-number-identifier'
import BigNumber from 'bignumber.js'
import { celoTokenBalanceSelector } from 'src/goldToken/selectors'
import { getRehydratePayload, REHYDRATE, RehydrateAction } from 'src/redux/persist-helper'
import { stableTokenBalanceSelector } from 'src/stableToken/reducer'
import { AttestationCode, CodeInputType } from 'src/verify/saga'

export const ATTESTATION_CODE_PLACEHOLDER = 'ATTESTATION_CODE_PLACEHOLDER'
export const ATTESTATION_ISSUER_PLACEHOLDER = 'ATTESTATION_ISSUER_PLACEHOLDER'

const ESTIMATED_COST_PER_ATTESTATION = 0.051

const rehydrate = createAction<any>(REHYDRATE)

export const setSeenVerificationNux = createAction<boolean>('VERIFY/SET_SEEN_VERIFICATION_NUX')
export const setKomenciContext = createAction<Partial<KomenciContext>>('VERIFY/SET_KOMENCI_CONTEXT')
export const checkIfKomenciAvailable = createAction('VERIFY/CHECK_IF_KOMENCI_AVAILABLE')
export const setKomenciAvailable = createAction<KomenciAvailable>('VERIFY/SET_KOMENCI_AVAILABLE')
export const start = createAction<{ e164Number: string }>('VERIFY/START')
export const stop = createAction('VERIFY/STOP')
export const setUseKomenci = createAction<boolean>('VERIFY/SET_USE_KOMENCI')
export const ensureRealHumanUser = createAction('VERIFY/ENSURE_REAL_HUMAN_USER')
export const startKomenciSession = createAction('VERIFY/START_KOMENCI_SESSION')
export const fetchPhoneNumberDetails = createAction('VERIFY/FETCH_PHONE_NUMBER')
export const fetchMtw = createAction('VERIFY/FETCH_MTW')
export const fetchOnChainData = createAction('VERIFY/FETCH_ON_CHAIN_DATA')
export const requestAttestations = createAction('VERIFY/REQUEST_ATTESTATIONS')
export const revealAttestations = createAction('VERIFY/REVEAL_ATTESTATIONS')
export const reportRevealStatus = createAction<{
  attestationServiceUrl: string
  account: string
  issuer: string
  e164Number: string
  pepper: string
}>('VERIFY/REPORT_REVEAL_STATUS')
export const completeAttestations = createAction('VERIFY/COMPLETE_ATTESTATIONS')
export const fail = createAction<string>('VERIFY/FAIL')
export const succeed = createAction('VERIFY/SUCCEED')
export const reset = createAction<{ komenci: boolean }>('VERIFY/RESET')
export const revoke = createAction('VERIFY/REVOKE')
export const cancel = createAction('VERIFY/CANCEL')
export const resendMessages = createAction('VERIFY/RESEND_MESSAGES')
export const receiveAttestationCode = createAction<{ message: string; inputType: CodeInputType }>(
  'VERIFY/RECEIVE_ATTESTATION_CODE'
)
export const inputAttestationCode = createAction<AttestationCode>('VERIFY/INPUT_ATTESTATION_CODE')
export const completeAttestationCode = createAction<AttestationCode>(
  'VERIFY/COMPLETE_ATTESTATION_CODE'
)
export const setCompletedCodes = createAction<number>('VERIFY/SET_COMPLETED_CODES')

export const setPhoneHash = createAction<string>('VERIFY/SET_PHONE_HASH')
export const setVerificationStatus = createAction<Partial<AttestationsStatus>>(
  'VERIFY/SET_VERIFICATION_STATUS'
)
export const setActionableAttestation = createAction<ActionableAttestation[]>(
  'VERIFY/SET_ACTIONABLE_ATTESTATIONS'
)
export const setRevealStatuses = createAction<Record<Address, RevealStatus>>(
  'VERIFY/SET_REVEAL_STATUSES'
)
export const setAllRevealStatuses = createAction<RevealStatus>('VERIFY/SET_ALL_REVEAL_STATUSES')
export const setLastRevealAttempt = createAction<number>('VERIFY/SET_LAST_REVEAL_ATTEMPT')

export enum VerificationStateType {
  Idle = 'Idle',
  Preparing = 'Preparing',
  EnsuringRealHumanUser = 'EnsuringRealHumanUser',
  StartingKomenciSession = 'StartingKomenciSession',
  FetchingPhoneNumberDetails = 'FetchingPhoneNumberDetails',
  FetchingMtw = 'FetchingMtw',
  FetchingOnChainData = 'FetchingOnChainData',
  RequestingAttestations = 'RequestingAttestations',
  RevealingAttestations = 'RevealingAttestations',
  CompletingAttestations = 'CompletingAttestations',
  Error = 'Error',
  Success = 'Success',
}

// Idle State
interface Idle {
  type: VerificationStateType.Idle
}
export const idle = (): Idle => ({ type: VerificationStateType.Idle })

// PreparingKomenci State
interface Preparing {
  type: VerificationStateType.Preparing
}
// {}: Omit<PreparingKomenci, 'type'>
export const preparing = (): Preparing => ({
  type: VerificationStateType.Preparing,
})

// EnsuringRealHumanUser State
interface EnsuringRealHumanUser {
  type: VerificationStateType.EnsuringRealHumanUser
}
export const ensuringRealHumanUser = (): EnsuringRealHumanUser => ({
  type: VerificationStateType.EnsuringRealHumanUser,
})

// StartingKomenciSession State
interface StartingKomenciSession {
  type: VerificationStateType.StartingKomenciSession
}
export const startingKomenciSession = (): StartingKomenciSession => ({
  type: VerificationStateType.StartingKomenciSession,
})

// FetchingPhoneNumberDetails State
interface FetchingPhoneNumberDetails {
  type: VerificationStateType.FetchingPhoneNumberDetails
}
export const fetchingPhoneNumberDetails = (): FetchingPhoneNumberDetails => ({
  type: VerificationStateType.FetchingPhoneNumberDetails,
})

// FetchingMtw State
interface FetchingMtw {
  type: VerificationStateType.FetchingMtw
}
export const fetchingMtw = (): FetchingMtw => ({
  type: VerificationStateType.FetchingMtw,
})

// FetchingVerificationOnChain State
interface FetchingOnChainData {
  type: VerificationStateType.FetchingOnChainData
}
export const fetchingOnChainData = (): FetchingOnChainData => ({
  type: VerificationStateType.FetchingOnChainData,
})

// RequestingAttestations State
interface RequestingAttestations {
  type: VerificationStateType.RequestingAttestations
}
export const requestingAttestations = (): RequestingAttestations => ({
  type: VerificationStateType.RequestingAttestations,
})

// RevealingAttestations State
interface RevealingAttestations {
  type: VerificationStateType.RevealingAttestations
}
export const revealingAttestations = (): RevealingAttestations => ({
  type: VerificationStateType.RevealingAttestations,
})

// CompletingAttestations State
interface CompletingAttestations {
  type: VerificationStateType.CompletingAttestations
}
export const completingAttestations = (): CompletingAttestations => ({
  type: VerificationStateType.CompletingAttestations,
})

// Error State
interface Error {
  type: VerificationStateType.Error
  message: string
}
export const error = (message: string): Error => ({
  type: VerificationStateType.Error,
  message,
})

// Succees State
interface Success {
  type: VerificationStateType.Success
}
export const success = (): Success => ({
  type: VerificationStateType.Success,
})

export type VerificationState =
  | Idle
  | Preparing
  | EnsuringRealHumanUser
  | StartingKomenciSession
  | FetchingPhoneNumberDetails
  | FetchingMtw
  | FetchingOnChainData
  | RequestingAttestations
  | RevealingAttestations
  | CompletingAttestations
  | Error
  | Success

export interface KomenciContext {
  errorTimestamps: number[]
  unverifiedMtwAddress: string | null
  sessionActive: boolean
  sessionToken: string
  callbackUrl: string | undefined
  captchaToken: string
}

export enum KomenciAvailable {
  Yes = 'YES',
  No = 'NO',
  Unknown = 'UNKNOWN',
}

export enum RevealStatus {
  NotRevealed = 'NOT_REVEALED',
  Revealed = 'REVEALED',
  Failed = 'FAILED',
}

export type OnChainVerificationStatus = AttestationsStatus & { komenci: boolean }

export type RevealStatuses = Record<Address, RevealStatus>

export interface State {
  seenVerificationNux: boolean
  status: OnChainVerificationStatus
  actionableAttestations: ActionableAttestation[]
  revealStatuses: RevealStatuses
  currentState: VerificationState
  komenci: KomenciContext
  komenciAvailable: KomenciAvailable
  phoneHash?: string
  e164Number?: string
  attestationCodes: AttestationCode[]
  completedAttestationCodes: AttestationCode[]
  lastRevealAttempt: number | null
}

const initialState: State = {
  seenVerificationNux: false,
  komenci: {
    errorTimestamps: [],
    unverifiedMtwAddress: null,
    sessionActive: false,
    sessionToken: '',
    callbackUrl: undefined,
    captchaToken: '',
  },
  status: {
    isVerified: false,
    numAttestationsRemaining: 3,
    total: 0,
    completed: 0,
    komenci: true,
  },
  actionableAttestations: [],
  revealStatuses: {},
  currentState: idle(),
  komenciAvailable: KomenciAvailable.Unknown,
  attestationCodes: [],
  completedAttestationCodes: [],
  lastRevealAttempt: null,
}

export const reducer = createReducer(initialState, (builder) => {
  builder
    .addCase(rehydrate, (state, action) => {
      // hack to allow rehydrate actions here
      const hydrated = getRehydratePayload((action as unknown) as RehydrateAction, 'verify')
      return {
        ...state,
        ...hydrated,
        komenci: {
          ...state.komenci,
          ...hydrated.komenci,
          captchaToken: initialState.komenci.captchaToken,
        },
        retries: 0,
        currentState: idle(),
      }
    })
    .addCase(stop, (state) => {
      return { ...state, currentState: idle() }
    })
    .addCase(start, (state, action) => {
      return {
        ...state,
        e164Number: action.payload.e164Number,
        currentState: preparing(),
      }
    })
    .addCase(ensureRealHumanUser, (state) => {
      return {
        ...state,
        currentState: ensuringRealHumanUser(),
      }
    })
    .addCase(startKomenciSession, (state) => {
      return {
        ...state,
        currentState: startingKomenciSession(),
      }
    })
    .addCase(fetchPhoneNumberDetails, (state) => {
      return {
        ...state,
        currentState: fetchingPhoneNumberDetails(),
      }
    })
    .addCase(setUseKomenci, (state, action) => {
      return {
        ...state,
        shouldUseKomenci: action.payload,
        komenci: initialState.komenci,
      }
    })
    .addCase(setPhoneHash, (state, action) => {
      return {
        ...state,
        phoneHash: action.payload,
      }
    })
    .addCase(fetchMtw, (state) => {
      return {
        ...state,
        currentState: fetchingMtw(),
      }
    })
    .addCase(fetchOnChainData, (state) => {
      return {
        ...state,
        currentState: fetchingOnChainData(),
      }
    })
    .addCase(setVerificationStatus, (state, action) => {
      return {
        ...state,
        status: {
          ...state.status,
          ...action.payload,
        },
      }
    })
    .addCase(setKomenciContext, (state, action) => {
      return {
        ...state,
        komenci: {
          ...state.komenci,
          ...action.payload,
        },
      }
    })
    .addCase(setActionableAttestation, (state, action) => {
      const actionableIssuers = action.payload.map((a) => a.issuer)
      return {
        ...state,
        revealStatuses: _.pick(state.revealStatuses, actionableIssuers),
        actionableAttestations: action.payload,
      }
    })
    .addCase(setRevealStatuses, (state, action) => {
      return {
        ...state,
        revealStatuses: { ...state.revealStatuses, ...action.payload },
      }
    })
    .addCase(setAllRevealStatuses, (state, action) => {
      return {
        ...state,
        revealStatuses: _.mapValues(state.revealStatuses, () => action.payload),
      }
    })
    .addCase(checkIfKomenciAvailable, (state) => {
      return {
        ...state,
        komenciAvailable: KomenciAvailable.Unknown,
      }
    })
    .addCase(setKomenciAvailable, (state, action) => {
      return {
        ...state,
        komenciAvailable: action.payload,
      }
    })
    .addCase(reset, (state, action) => {
      return {
        ...initialState,
        e164Number: state.e164Number,
        status: {
          ...initialState.status,
          komenci: action.payload.komenci,
        },
        komenciAvailable: action.payload.komenci ? KomenciAvailable.Yes : KomenciAvailable.No,
      }
    })
    .addCase(fail, (state, action) => {
      return {
        ...state,
        currentState: error(action.payload),
      }
    })
    .addCase(succeed, (state) => {
      return {
        ...state,
        currentState: success(),
      }
    })
    .addCase(revoke, () => {
      return {
        ...initialState,
      }
    })
    .addCase(setSeenVerificationNux, (state, action) => {
      return {
        ...state,
        seenVerificationNux: action.payload,
      }
    })
    .addCase(setCompletedCodes, (state, action) => {
      // Ensure action.payload many codes are filled
      const attestationCodes = []
      for (let i = 0; i < action.payload; i++) {
        attestationCodes[i] = state.completedAttestationCodes[i] || {
          code: ATTESTATION_CODE_PLACEHOLDER,
          issuer: ATTESTATION_ISSUER_PLACEHOLDER,
        }
      }
      return {
        ...state,
        attestationCodes,
      }
    })
    .addCase(inputAttestationCode, (state, action) => {
      return {
        ...state,
        attestationCodes: [...state.attestationCodes, action.payload],
      }
    })
    .addCase(completeAttestationCode, (state, action) => {
      return {
        ...state,
        status: {
          ...state.status,
          numAttestationsRemaining: state.status.numAttestationsRemaining - 1,
          completed: state.status.completed + 1,
        },
        completedAttestationCodes: [...state.completedAttestationCodes, action.payload],
      }
    })
    .addCase(requestAttestations, (state) => {
      return {
        ...state,
        currentState: requestingAttestations(),
      }
    })
    .addCase(revealAttestations, (state) => {
      return {
        ...state,
        currentState: revealingAttestations(),
      }
    })
    .addCase(completeAttestations, (state) => {
      return {
        ...state,
        currentState: completingAttestations(),
      }
    })
    .addCase(setLastRevealAttempt, (state, action) => {
      return {
        ...state,
        lastRevealAttempt: action.payload,
      }
    })
})

const isBalanceSufficientForAttestations = (
  userBalance: BigNumber.Value,
  attestationsRemaining: number
) => {
  return new BigNumber(userBalance).isGreaterThan(
    attestationsRemaining * ESTIMATED_COST_PER_ATTESTATION
  )
}

export const currentStateSelector = (state: RootState) => state.verify.currentState
export const e164NumberSelector = (state: RootState) => state.verify.e164Number
export const phoneHashSelector = (state: RootState) => state.verify.phoneHash
export const komenciContextSelector = (state: RootState) => state.verify.komenci
export const shouldUseKomenciSelector = (state: RootState) => {
  if (state.verify.komenciAvailable === KomenciAvailable.Unknown) {
    return undefined
  }
  const verificationHasStarted = state.verify.status.total > 0
  // Only use Komenci when verification has not started with classic flow
  return (
    state.verify.komenciAvailable === KomenciAvailable.Yes &&
    !(verificationHasStarted && !state.verify.status.komenci)
  )
}

export const verificationStatusSelector = (state: RootState) => state.verify.status
export const attestationCodesSelector = (state: RootState) => state.verify.attestationCodes
export const completedAttestationCodesSelector = (state: RootState) =>
  state.verify.completedAttestationCodes
export const actionableAttestationsSelector = (state: RootState): ActionableAttestation[] =>
  state.verify.actionableAttestations

export const revealStatusesSelector = (state: RootState): RevealStatuses =>
  state.verify.revealStatuses

export const isBalanceSufficientForSigRetrievalSelector = createSelector(
  [stableTokenBalanceSelector, celoTokenBalanceSelector],
  (stableTokenBalance, celoTokenBalance) =>
    isBalanceSufficientForSigRetrieval(stableTokenBalance || 0, celoTokenBalance || 0)
)

export const isBalanceSufficientSelector = createSelector(
  [
    stableTokenBalanceSelector,
    actionableAttestationsSelector,
    verificationStatusSelector,
    phoneHashSelector,
    isBalanceSufficientForSigRetrievalSelector,
  ],
  (
    stableTokenBalance,
    actionableAttestations,
    { numAttestationsRemaining },
    phoneHash,
    balanceSufficientForSigRetrieval
  ) => {
    const attestationsRemaining = numAttestationsRemaining - actionableAttestations.length
    const isBalanceSufficient = !phoneHash
      ? balanceSufficientForSigRetrieval
      : isBalanceSufficientForAttestations(stableTokenBalance || 0, attestationsRemaining)

    return isBalanceSufficient
  }
)
