import BigNumber from 'bignumber.js'

// Ref: https://github.com/celo-org/developer-tooling/blob/6148646a29e5e719df9a1b32d1580ea7e6e61be8/packages/sdk/utils/src/parsing.ts#L7
export const parseInputAmount = (inputString: string, decimalSeparator = '.'): BigNumber => {
  if (decimalSeparator !== '.') {
    inputString = inputString.replace(decimalSeparator, '.')
  }
  return new BigNumber(inputString || '0')
}

// Ref: https://github.com/celo-org/developer-tooling/blob/f1677581b90675e37a4846ce53b29d8615a056e6/packages/sdk/base/src/parsing.ts#L1
export const stringToBoolean = (inputString: string): boolean => {
  const lowercasedInput = inputString.toLowerCase().trim()
  if (lowercasedInput === 'true') {
    return true
  } else if (lowercasedInput === 'false') {
    return false
  }
  throw new Error(`Unable to parse '${inputString}' as boolean`)
}
