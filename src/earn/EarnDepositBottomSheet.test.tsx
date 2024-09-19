import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { openUrl } from 'src/app/actions'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { depositStart } from 'src/earn/slice'
import { isGasSubsidizedForNetwork } from 'src/earn/utils'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { createMockStore } from 'test/utils'
import {
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockTokenBalances,
} from 'test/values'

jest.mock('src/earn/utils')

const mockPreparedTransaction: PreparedTransactionsPossible = {
  type: 'possible' as const,
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(5e12),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(1e12),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
  ],
  feeCurrency: {
    ...mockTokenBalances[mockArbEthTokenId],
    isNative: true,
    balance: new BigNumber(10),
    priceUsd: new BigNumber(1),
    lastKnownPriceUsd: new BigNumber(1),
  },
}

describe('EarnDepositBottomSheet', () => {
  const expectedAnalyticsProperties = {
    depositTokenId: mockArbUsdcTokenId,
    tokenAmount: '100',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: mockEarnPositions[0].appId,
    poolId: mockEarnPositions[0].positionId,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(false)
  })

  it('renders all elements', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: { tokenBalances: mockTokenBalances },
        })}
      >
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )
    expect(getByText('earnFlow.depositBottomSheet.title')).toBeTruthy()
    expect(
      getByText('earnFlow.depositBottomSheet.descriptionV1_93, {"providerName":"Aave"}')
    ).toBeTruthy()

    expect(queryByTestId('EarnDeposit/GasSubsidized')).toBeFalsy()

    expect(getByText('earnFlow.depositBottomSheet.yieldRate')).toBeTruthy()
    expect(getByText('earnFlow.depositBottomSheet.apy, {"apy":"1.92"}')).toBeTruthy()

    expect(getByText('earnFlow.depositBottomSheet.amount')).toBeTruthy()
    expect(getByTestId('EarnDeposit/Amount')).toHaveTextContent('100.00 USDC(₱133.00)')

    expect(getByText('earnFlow.depositBottomSheet.fee')).toBeTruthy()
    expect(getByTestId('EarnDeposit/Fee')).toHaveTextContent('₱0.012(0.000006 ETH)')

    expect(getByText('earnFlow.depositBottomSheet.provider')).toBeTruthy()
    expect(getByText('Aave')).toBeTruthy()
    expect(getByTestId('EarnDeposit/ProviderInfo')).toBeTruthy()

    expect(getByText('earnFlow.depositBottomSheet.network')).toBeTruthy()
    expect(getByText('Arbitrum Sepolia')).toBeTruthy()

    expect(
      getByText('earnFlow.depositBottomSheet.footerV1_93, {"providerName":"Aave"}')
    ).toBeTruthy()

    expect(getByTestId('EarnDeposit/PrimaryCta')).toBeTruthy()
    expect(getByTestId('EarnDeposit/SecondaryCta')).toBeTruthy()
  })

  it('pressing complete submits action and fires analytics event', () => {
    const store = createMockStore({ tokens: { tokenBalances: mockTokenBalances } })
    const { getByTestId } = render(
      <Provider store={store}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/PrimaryCta'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_complete,
      expectedAnalyticsProperties
    )
    expect(store.getActions()).toEqual([
      {
        type: depositStart.type,
        payload: {
          amount: '100',
          pool: mockEarnPositions[0],
          preparedTransactions: getSerializablePreparedTransactions(
            mockPreparedTransaction.transactions
          ),
        },
      },
    ])
  })

  it('pressing cancel fires analytics event', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/SecondaryCta'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_cancel,
      expectedAnalyticsProperties
    )
  })

  it('pressing provider info opens the terms and conditions', () => {
    const store = createMockStore({ tokens: { tokenBalances: mockTokenBalances } })
    const { getByTestId } = render(
      <Provider store={store}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/ProviderInfo'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_provider_info_press,
      expectedAnalyticsProperties
    )
    expect(store.getActions()).toEqual([openUrl('termsUrl', true)])
  })

  it('pressing terms and conditions opens the terms and conditions', () => {
    const store = createMockStore({ tokens: { tokenBalances: mockTokenBalances } })
    const { getByTestId } = render(
      <Provider store={store}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/TermsAndConditions'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_terms_and_conditions_press,
      expectedAnalyticsProperties
    )
    expect(store.getActions()).toEqual([openUrl('termsUrl', true)])
  })

  it('shows loading state and buttons are disabled when deposit is submitted', () => {
    const store = createMockStore({
      tokens: { tokenBalances: mockTokenBalances },
      earn: { depositStatus: 'loading' },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )

    expect(getByTestId('EarnDeposit/PrimaryCta')).toBeDisabled()
    expect(getByTestId('EarnDeposit/SecondaryCta')).toBeDisabled()
    expect(getByTestId('EarnDeposit/PrimaryCta')).toContainElement(getByTestId('Button/Loading'))
  })

  it('shows gas subsidized copy if feature gate is set', () => {
    jest.mocked(isGasSubsidizedForNetwork).mockReturnValue(true)
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          pool={mockEarnPositions[0]}
        />
      </Provider>
    )

    expect(getByTestId('EarnDeposit/GasSubsidized')).toBeTruthy()
  })
})
