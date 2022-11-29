/* eslint-disable max-classes-per-file */
import { RootError } from '@celo/base'

const KOMENCI_ERROR_WINDOW = 1000 * 60 * 60 * 3 // 3 hours
const KOMENCI_ERROR_ALLOTMENT = 2

export enum FeelessVerificationErrors {
  KomenciErrorQuotaExceeded = 'KomenciErrorQuotaExceeded',
  KomenciSessionInvalidError = 'KomenciSessionInvalidError',
  PepperNotCachedError = 'PepperNotCachedError',
}

// When Komenci has failed more than allowed within a given window
export class KomenciErrorQuotaExceeded extends RootError<FeelessVerificationErrors.KomenciErrorQuotaExceeded> {
  constructor() {
    super(FeelessVerificationErrors.KomenciErrorQuotaExceeded)
    Object.setPrototypeOf(this, KomenciErrorQuotaExceeded.prototype)
  }
}

// When the Komenci session is no longer valid
export class KomenciSessionInvalidError extends RootError<FeelessVerificationErrors.KomenciSessionInvalidError> {
  constructor() {
    super(FeelessVerificationErrors.KomenciSessionInvalidError)
    Object.setPrototypeOf(this, KomenciSessionInvalidError.prototype)
  }
}

// When the pepper is not in the redux store
export class PepperNotCachedError extends RootError<FeelessVerificationErrors.PepperNotCachedError> {
  constructor() {
    super(FeelessVerificationErrors.PepperNotCachedError)
    Object.setPrototypeOf(this, PepperNotCachedError.prototype)
  }
}

// If a user has already encountered too many errors within a given window,
// do not allow them try verifing using Komenci again
export const hasExceededKomenciErrorQuota = (komenciErrorTimestamps: number[]) => {
  const currentTime = Date.now()
  const recentErrors = komenciErrorTimestamps.filter(
    (timestamp) => currentTime - timestamp < KOMENCI_ERROR_WINDOW
  )

  return recentErrors.length > KOMENCI_ERROR_ALLOTMENT
}
