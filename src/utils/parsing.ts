import BigNumber from 'bignumber.js'

export const parseInputAmount = (inputString: string, decimalSeparator = '.'): BigNumber => {
  if (decimalSeparator !== '.') {
    inputString = inputString.replace(decimalSeparator, '.')
  }
  return new BigNumber(inputString || '0')
}

export const stringToBoolean = (inputString: string): boolean => {
  const lowercasedInput = inputString.toLowerCase().trim()
  if (lowercasedInput === 'true') {
    return true
  } else if (lowercasedInput === 'false') {
    return false
  }
  throw new Error(`Unable to parse '${inputString}' as boolean`)
}
