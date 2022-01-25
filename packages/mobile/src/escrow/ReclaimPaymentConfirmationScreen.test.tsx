import { render, waitFor } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { Provider } from 'react-redux'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import { getReclaimEscrowFee, reclaimFromEscrow } from 'src/escrow/saga'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { Screens } from 'src/navigator/Screens'
import { Currency } from 'src/utils/currencies'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import {
  mockAccount,
  mockAccount2,
  mockCusdAddress,
  mockE164Number,
  mockE164NumberHashWithPepper,
} from 'test/values'

// A fee of 0.01 cUSD.
const TEST_FEE_INFO_CUSD = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  feeCurrency: mockCusdAddress,
}

// A fee of 0.01 CELO.
const TEST_FEE_INFO_CELO = {
  fee: new BigNumber(10).pow(16),
  gas: new BigNumber(200000),
  gasPrice: new BigNumber(10).pow(10).times(5),
  feeCurrency: undefined,
}

jest.mock('src/escrow/saga')

const mockedGetReclaimEscrowFee = getReclaimEscrowFee as jest.Mock
const mockedReclaimPayment = reclaimFromEscrow as jest.Mock

const store = createMockStore()

const mockScreenProps = getMockStackScreenProps(Screens.ReclaimPaymentConfirmationScreen, {
  reclaimPaymentInput: {
    senderAddress: mockAccount2,
    recipientPhone: mockE164Number,
    recipientIdentifier: mockE164NumberHashWithPepper,
    paymentID: mockAccount,
    currency: Currency.Dollar,
    amount: new BigNumber(10).times(WEI_PER_TOKEN),
    timestamp: new BigNumber(10000),
    expirySeconds: new BigNumber(50000),
  },
})

describe('ReclaimPaymentConfirmationScreen', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockedGetReclaimEscrowFee.mockClear()
  })

  it('renders correctly with fee in Celo dollars', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)

    const { getByText, queryByText, queryAllByText, toJSON } = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    // Initial render should not contain a fee.
    expect(toJSON()).toMatchSnapshot()
    expect(queryAllByText('securityFee')).toHaveLength(2)
    expect(queryByText(/-\s*₱\s*0\.0133/s)).toBeNull()

    // Wait for fee to be calculated and displayed as "₱0.013"
    // NOTE: Use regex here because the text may be split by a newline.
    await waitFor(() => getByText(/-\s*₱\s*0\.0133/s))
    expect(toJSON()).toMatchSnapshot()
    // Query for the total amount, which should deduct the fee.
    expect(queryByText(/₱\s*13\.28/s)).not.toBeNull()
  })

  it('renders correctly in with fee in CELO', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => TEST_FEE_INFO_CELO)

    const { getByText, queryByText, queryAllByText, toJSON } = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    // Initial render should not contain a fee.
    expect(toJSON()).toMatchSnapshot()
    expect(queryAllByText('securityFee')).toHaveLength(2)
    expect(queryByText(/-\s*0\.01/s)).toBeNull()

    // Wait for fee to be calculated and displayed as "0.01"
    // NOTE: Use regex here because the text may be split by a newline.
    await waitFor(() => getByText(/-\s*0\.01/s))
    expect(toJSON()).toMatchSnapshot()
    // Query for the total amount, which should deduct the fee.
    expect(queryByText(/₱\s*13\.28/s)).not.toBeNull()
  })

  it('renders correctly when fee calculation fails', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => {
      throw new Error('Calculate fee failed')
    })

    const { queryAllByText, queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryAllByText('securityFee')).toHaveLength(2)
    expect(queryByText('₱0.001')).toBeNull()
    expect(queryAllByText('$10.00')).toHaveLength(1)

    // Wait for fee error
    await waitFor(() => getByText('---'))

    expect(queryAllByText('$10.00')).toHaveLength(1)
    expect(toJSON()).toMatchSnapshot()
  })

  it('shows the activity indicator when a reclaim is in progress', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)

    const tree = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy()
  })

  it('clears the activity indicator when a reclaim fails', async () => {
    mockedGetReclaimEscrowFee.mockImplementation(async () => TEST_FEE_INFO_CUSD)
    mockedReclaimPayment.mockImplementation(async () => {
      throw Error(ErrorMessages.TRANSACTION_FAILED)
    })

    const tree = render(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    await flushMicrotasksQueue()

    expect(tree.UNSAFE_queryByType(ActivityIndicator)).toBeFalsy()
  })
})
