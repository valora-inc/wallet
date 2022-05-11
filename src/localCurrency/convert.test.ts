import BigNumber from 'bignumber.js'
import {
  convertDollarsToLocalAmount,
  convertLocalAmountToDollars,
  convertToMaxSupportedPrecision,
} from 'src/localCurrency/convert'
import { getMoneyDisplayValue } from 'src/utils/formatting'

describe(convertToMaxSupportedPrecision, () => {
  const EXCHANGE_RATE = 19.67

  it('should convert an amount entered in a local currency so it displays the same when converted back to the local currency', () => {
    const enteredLocalAmount = '2.99'
    const dollarsAmount = convertLocalAmountToDollars(enteredLocalAmount, EXCHANGE_RATE)
    const dollarsResult = convertToMaxSupportedPrecision(dollarsAmount!)
    const localAmountResult = convertDollarsToLocalAmount(dollarsResult, EXCHANGE_RATE)

    expect(getMoneyDisplayValue(localAmountResult!)).toEqual('2.99')
  })

  it('should not affect amounts which have less than 18 decimals (the max precision)', () => {
    const dollarsResult = convertToMaxSupportedPrecision(new BigNumber('2.99'))
    expect(dollarsResult.toString()).toEqual('2.99')
  })

  it('should round amounts with more than 18 decimals to 18 decimals (the max precision)', () => {
    const dollarsResult = convertToMaxSupportedPrecision(new BigNumber('0.01183102924038876762'))
    expect(dollarsResult.toString()).toEqual('0.011831029240388768')
  })
})
