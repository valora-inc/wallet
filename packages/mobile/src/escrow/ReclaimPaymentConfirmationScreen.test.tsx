import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { ActivityIndicator } from 'react-native'
import { Provider } from 'react-redux'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import { FeeEstimateState, FeeType } from 'src/fees/reducer'
import { FeeInfo } from 'src/fees/saga'
import { WEI_PER_TOKEN } from 'src/geth/consts'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getElementText, getMockStackScreenProps } from 'test/utils'
import {
  emptyFees,
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

const mockFeeEstimate = ({
  error = false,
  loading = false,
  usdFee = null,
  feeInfo,
}: {
  error?: boolean
  loading?: boolean
  usdFee?: string | null
  feeInfo?: FeeInfo
}) => ({
  usdFee,
  lastUpdated: 500,
  loading,
  error,
  feeInfo,
})

jest.mock('src/escrow/saga')

const store = (feeEstimate: FeeEstimateState) =>
  createMockStore({
    fees: {
      estimates: {
        [mockCusdAddress]: {
          ...emptyFees,
          [FeeType.RECLAIM_ESCROW]: feeEstimate,
        },
      },
    },
  })

const mockScreenProps = getMockStackScreenProps(Screens.ReclaimPaymentConfirmationScreen, {
  reclaimPaymentInput: {
    senderAddress: mockAccount2,
    recipientPhone: mockE164Number,
    recipientIdentifier: mockE164NumberHashWithPepper,
    paymentID: mockAccount,
    tokenAddress: mockCusdAddress,
    amount: new BigNumber(10).times(WEI_PER_TOKEN).toString(),
    timestamp: new BigNumber(10000),
    expirySeconds: new BigNumber(50000),
  },
})

describe('ReclaimPaymentConfirmationScreen', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('renders correctly with fee in cUSD', async () => {
    const { getByTestId } = render(
      <Provider store={store(mockFeeEstimate({ feeInfo: TEST_FEE_INFO_CUSD, usdFee: '0.01' }))}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(getByTestId('LineItemRow/ReclaimAmount'))).toBe('₱13.30')
    expect(getElementText(getByTestId('ReclaimFee'))).toBe('₱0.013')
    expect(getElementText(getByTestId('TotalLineItem/Total'))).toBe('₱13.29')
    expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toBe('9.99 cUSD')
    expect(getByTestId('ConfirmButton')).not.toBeDisabled()
  })

  it('renders correctly in with fee in CELO', async () => {
    const { getByTestId } = render(
      <Provider store={store(mockFeeEstimate({ feeInfo: TEST_FEE_INFO_CELO, usdFee: '0.05' }))}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(getByTestId('LineItemRow/ReclaimAmount'))).toBe('₱13.30')
    expect(getElementText(getByTestId('ReclaimFee'))).toBe('₱0.067')
    expect(getElementText(getByTestId('TotalLineItem/Total'))).toBe('₱13.23')
    expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toBe('9.95 cUSD')
    expect(getByTestId('ConfirmButton')).not.toBeDisabled()
  })

  it('renders correctly when fee calculation fails', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={store(mockFeeEstimate({ error: true }))}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    expect(getElementText(getByTestId('LineItemRow/ReclaimAmount'))).toBe('₱13.30')
    expect(queryByTestId('ReclaimFee')).toBeFalsy()
    expect(getElementText(getByTestId('LineItemRow/SecurityFee'))).toBe('---')
    expect(getElementText(getByTestId('TotalLineItem/Total'))).toBe('₱13.30')
    expect(getElementText(getByTestId('TotalLineItem/Subtotal'))).toBe('10.00 cUSD')
    expect(getByTestId('ConfirmButton')).toBeDisabled()
  })

  it('shows the activity indicator when a reclaim is in progress', async () => {
    const tree = render(
      <Provider store={store(mockFeeEstimate({ loading: true }))}>
        <ReclaimPaymentConfirmationScreen {...mockScreenProps} />
      </Provider>
    )

    expect(tree.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy()
  })
})
