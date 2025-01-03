/**
 * Reference file:
 * https://github.com/celo-org/developer-tooling/blob/6148646a29e5e719df9a1b32d1580ea7e6e61be8/packages/sdk/utils/src/parsing.test.ts
 */

import BigNumber from 'bignumber.js'
import { parseInputAmount, stringToBoolean } from 'src/utils/parsing'

test('stringToBoolean()', () => {
  expect(stringToBoolean('true')).toBe(true)
  expect(stringToBoolean('      true    ')).toBe(true)
  expect(stringToBoolean('false')).toBe(false)
  expect(stringToBoolean('      false   ')).toBe(false)

  expect(stringToBoolean('FaLse')).toBe(false)
  expect(stringToBoolean('TruE')).toBe(true)

  expect(() => stringToBoolean('fals')).toThrow("Unable to parse 'fals' as boolean")
})

test('stringToBigNum()', () => {
  expect(parseInputAmount('.1')).toStrictEqual(new BigNumber('0.1'))
  expect(parseInputAmount('.1 ')).toStrictEqual(new BigNumber('0.1'))
  expect(parseInputAmount('1.')).toStrictEqual(new BigNumber('1'))
  expect(parseInputAmount('0')).toStrictEqual(new BigNumber('0'))
  expect(parseInputAmount('')).toStrictEqual(new BigNumber('0'))
  expect(parseInputAmount('1.23')).toStrictEqual(new BigNumber('1.23'))
  expect(parseInputAmount('1,23')).toStrictEqual(new BigNumber(NaN))
  expect(parseInputAmount('1,23', ',')).toStrictEqual(new BigNumber('1.23'))
})
