import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { depositStart } from 'src/earn/slice'
import * as earnUtils from 'src/earn/utils'
import { navigate } from 'src/navigator/NavigationService'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockEarnPositions,
  mockTokenBalances,
  mockUSDCAddress,
} from 'test/values'

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

const mockDepositProps = {
  forwardedRef: { current: null },
  inputAmount: new BigNumber(100),
  preparedTransaction: mockPreparedTransaction,
  pool: mockEarnPositions[0],
  mode: 'deposit' as const,
  inputTokenId: mockArbUsdcTokenId,
}

const mockSwapDepositProps = {
  ...mockDepositProps,
  mode: 'swap-deposit' as const,
  inputTokenId: mockArbEthTokenId,
  inputAmount: new BigNumber(0.041),
  swapTransaction: {
    swapType: 'same-chain' as const,
    chainId: 42161,
    price: '2439',
    guaranteedPrice: '2377',
    appFeePercentageIncludedInPrice: '0.6',
    sellTokenAddress: '0xEeeeeeE',
    buyTokenAddress: mockUSDCAddress,
    sellAmount: '41000000000000000',
    buyAmount: '99999000',
    allowanceTarget: '0x0000000000000000000000000000000000000123',
    from: mockAccount,
    to: '0x0000000000000000000000000000000000000123',
    value: '0',
    data: '0x0',
    gas: '1800000',
    estimatedGasUse: undefined,
    estimatedPriceImpact: '0.1',
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
    jest.spyOn(earnUtils, 'isGasSubsidizedForNetwork').mockReturnValue(false)
  })

  it('renders all elements for deposit', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: { tokenBalances: mockTokenBalances },
        })}
      >
        <EarnDepositBottomSheet {...mockDepositProps} />
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

  it('renders all elements for swap-deposit', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: { tokenBalances: mockTokenBalances },
        })}
      >
        <EarnDepositBottomSheet {...mockSwapDepositProps} />
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

    expect(getByTestId('EarnDeposit/Swap/From')).toHaveTextContent('0.041 ETH')
    expect(getByTestId('EarnDeposit/Swap/To')).toHaveTextContent('100.00 USDC')

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
        <EarnDepositBottomSheet {...mockDepositProps} />
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
        <EarnDepositBottomSheet {...mockDepositProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/SecondaryCta'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_cancel,
      expectedAnalyticsProperties
    )
  })

  it('pressing provider info opens the terms and conditions', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet {...mockDepositProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/ProviderInfo'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_provider_info_press,
      expectedAnalyticsProperties
    )
    expect(navigate).toHaveBeenCalledWith('WebViewScreen', { uri: 'termsUrl' })
  })

  it('pressing terms and conditions opens the terms and conditions', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet {...mockDepositProps} />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/TermsAndConditions'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_terms_and_conditions_press,
      expectedAnalyticsProperties
    )
    expect(navigate).toHaveBeenCalledWith('WebViewScreen', { uri: 'termsUrl' })
  })

  it('shows loading state and buttons are disabled when deposit is submitted', () => {
    const store = createMockStore({
      tokens: { tokenBalances: mockTokenBalances },
      earn: { depositStatus: 'loading' },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <EarnDepositBottomSheet {...mockDepositProps} />
      </Provider>
    )

    expect(getByTestId('EarnDeposit/PrimaryCta')).toBeDisabled()
    expect(getByTestId('EarnDeposit/SecondaryCta')).toBeDisabled()
    expect(getByTestId('EarnDeposit/PrimaryCta')).toContainElement(getByTestId('Button/Loading'))
  })

  it('shows gas subsidized copy if feature gate is set', () => {
    jest.spyOn(earnUtils, 'isGasSubsidizedForNetwork').mockReturnValue(true)
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet {...mockDepositProps} />
      </Provider>
    )

    expect(getByTestId('EarnDeposit/GasSubsidized')).toBeTruthy()
  })
})
