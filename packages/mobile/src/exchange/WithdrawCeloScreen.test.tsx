// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import WithdrawCeloScreen from 'src/exchange/WithdrawCeloScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

expect.extend({ toBeDisabled })

const SAMPLE_ADDRESS = '0xcc642068bdbbdeb91f348213492d2a80ab1ed23c'
const SAMPLE_BALANCE = '55.00001'
const SAMPLE_BALANCE_MINUS_FEES = '54.99901'

const mockScreenProps = getMockStackScreenProps(Screens.WithdrawCeloScreen, { isCashOut: false })

const store = createMockStore({
  goldToken: { balance: SAMPLE_BALANCE },
})

const mockFeeInfo = {
  fee: new BigNumber(10).pow(15),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(9).times(5),
  currency: Currency.Celo,
}

jest.mock('src/fees/CalculateFee', () => ({
  useSendFee: () => ({
    result: mockFeeInfo,
    loading: false,
  }),
}))

jest.mock('react-native-localize', () => ({
  getNumberFormatSettings: () => ({
    decimalSeparator: ',',
  }),
}))

describe('WithdrawCeloScreen', () => {
  it('renders correctly', () => {
    const tree = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('navigates to the scan QR screen when the QR button is pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('ScanQR'))

    jest.runOnlyPendingTimers()

    expect(navigate).toHaveBeenCalledWith(
      Screens.WithdrawCeloQrScannerScreen,
      expect.objectContaining({
        onAddressScanned: expect.any(Function),
      })
    )
  })

  it('populates amount with max balance when the max button is pressed', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)

    expect(getByTestId('CeloAmount').props.value).toBe('')
    fireEvent.press(getByTestId('MaxAmount'))
    expect(parseFloat(getByTestId('CeloAmount').props.value).toFixed(5)).toBe(
      SAMPLE_BALANCE_MINUS_FEES
    )

    expect(getByTestId('WithdrawReviewButton')).not.toBeDisabled()
  })

  it('decimals with comma separators work correctly', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )

    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)
    fireEvent.changeText(getByTestId('CeloAmount'), '50,1')
    expect(getByTestId('WithdrawReviewButton')).not.toBeDisabled()

    fireEvent.press(getByTestId('WithdrawReviewButton'))

    jest.runOnlyPendingTimers()

    expect(navigate).toHaveBeenCalledWith(
      Screens.WithdrawCeloReviewScreen,
      expect.objectContaining({
        amount: new BigNumber(50.1),
      })
    )
  })

  it('disables the review button if the amount is greater than the balance', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)

    fireEvent.changeText(getByTestId('CeloAmount'), '55.00002')
    expect(getByTestId('WithdrawReviewButton')).toBeDisabled()
  })

  it('disables the review button if the address is not the correct length or format', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen {...mockScreenProps} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('CeloAmount'), '1')

    // Address is too long
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS + 'a')
    expect(getByTestId('WithdrawReviewButton')).toBeDisabled()

    // Address doesn't start with 0x
    fireEvent.changeText(
      getByTestId('AccountAddress'),
      '1xcc642068bdbbdeb91f348213492d2a80ab1ed23c'
    )
    expect(getByTestId('WithdrawReviewButton')).toBeDisabled()

    // Address is too short
    fireEvent.changeText(getByTestId('AccountAddress'), '0xcc642068bdbbdeb91f348213492d2a80ab1ed23')
    expect(getByTestId('WithdrawReviewButton')).toBeDisabled()

    // Account address is correct length
    fireEvent.changeText(getByTestId('AccountAddress'), SAMPLE_ADDRESS)
    expect(getByTestId('WithdrawReviewButton')).not.toBeDisabled()
  })

  it('populates fields with values received in params', async () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <WithdrawCeloScreen
          {...getMockStackScreenProps(Screens.WithdrawCeloScreen, {
            isCashOut: false,
            amount: new BigNumber(10.5),
            recipientAddress: SAMPLE_ADDRESS,
          })}
        />
      </Provider>
    )

    expect(getByTestId('CeloAmount').props.value).toBe('10.5')
    expect(getByTestId('AccountAddress').props.value).toBe(SAMPLE_ADDRESS)
    expect(getByTestId('WithdrawReviewButton')).not.toBeDisabled()
  })
})
