import * as Sentry from '@sentry/react-native'
import BigNumber from 'bignumber.js'
import App from 'src/app/App'

jest.mock('src/redux/store')
jest.mock('react-native-screens')
jest.mock('react-native-localize', () => ({
  getNumberFormatSettings: jest
    .fn()
    .mockReturnValue({ decimalSeparator: ',', groupingSeparator: '.' }),
}))

describe('App', () => {
  it('wraps sentry', () => {
    expect(App).toBeDefined()
    expect(Sentry.wrap).toHaveBeenCalledWith(App)
  })

  it('big number formats large numbers with separators from RN localize', () => {
    expect(new BigNumber(1000000).toFormat(2)).toEqual('1.000.000,00')
  })
})
