import { parsePhoneNumber } from '@celo/utils/lib/phoneNumbers'
import { CodeInputStatus } from 'src/components/CodeInput'

export function getPhoneNumberState(
  phoneNumber: string,
  countryCallingCode: string,
  countryCodeAlpha2: string
) {
  const phoneDetails = parsePhoneNumber(phoneNumber, countryCallingCode)

  if (phoneDetails) {
    return {
      // Show international display number to avoid confusion
      internationalPhoneNumber: phoneDetails.displayNumberInternational,
      e164Number: phoneDetails.e164Number,
      isValidNumber: true,
      countryCodeAlpha2: phoneDetails.regionCode!,
    }
  } else {
    return {
      internationalPhoneNumber: phoneNumber,
      e164Number: '',
      isValidNumber: false,
      countryCodeAlpha2,
    }
  }
}

export function isCodeRepeated(codes: string[], value: string) {
  let repetitions = 0
  for (const code of codes) {
    if (code === value) {
      repetitions++
    }
  }
  return repetitions >= 2
}

/**
 * @returns the index in which a new attestaion code can be input.
 * Note that this will return |NUM_ATTESTATIONS_REQUIRED| if all positions are full.
 */
export function indexReadyForInput(attestationInputStatus: CodeInputStatus[]) {
  const isPositionBusy = (index: number) =>
    [CodeInputStatus.Processing, CodeInputStatus.Accepted, CodeInputStatus.Received].includes(
      attestationInputStatus[index]
    )
  let shouldBeInputtingIndex = 0
  while (isPositionBusy(shouldBeInputtingIndex)) {
    shouldBeInputtingIndex++
  }
  return shouldBeInputtingIndex
}
