import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { openUrl } from 'src/app/actions'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { depositStart } from 'src/earn/slice'
import { EarnActiveMode } from 'src/earn/types'
import * as earnUtils from 'src/earn/utils'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockArbEthTokenId,
  mockArbUsdcTokenId,
  mockCeloTokenId,
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
  mode: 'deposit' as EarnActiveMode,
  inputTokenId: mockArbUsdcTokenId,
}

const mockSwapDepositProps = {
  ...mockDepositProps,
  mode: 'swap-deposit' as EarnActiveMode,
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

const mockCrossChainProps = {
  ...mockSwapDepositProps,
  preparedTransaction: {
    ...mockPreparedTransaction,
    feeCurrency: {
      ...mockTokenBalances[mockCeloTokenId],
      isNative: true,
      balance: new BigNumber(10),
      priceUsd: new BigNumber(1),
      lastKnownPriceUsd: new BigNumber(1),
    },
  },
  inputTokenId: mockCeloTokenId,
  swapTransaction: {
    ...mockSwapDepositProps.swapTransaction,
    swapType: 'cross-chain' as const,
    estimatedDuration: 300,
    maxCrossChainFee: '0.1',
    estimatedCrossChainFee: '0.05',
  },
}

describe('EarnDepositBottomSheet', () => {
  const commonAnalyticsProperties = {
    depositTokenId: mockArbUsdcTokenId,
    depositTokenAmount: '100',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: mockEarnPositions[0].appId,
    poolId: mockEarnPositions[0].positionId,
    fromNetworkId: NetworkId['arbitrum-sepolia'],
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

  it.each([
    { swapType: 'same-chain', props: mockSwapDepositProps, fromSymbol: 'ETH', fiatFee: '0.012' },
    { swapType: 'cross-chain', props: mockCrossChainProps, fromSymbol: 'CELO', fiatFee: '0.00011' },
  ])('renders all elements for $swapType swap-deposit', ({ props, fromSymbol, fiatFee }) => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          tokens: { tokenBalances: mockTokenBalances },
        })}
      >
        <EarnDepositBottomSheet {...props} />
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

    expect(getByTestId('EarnDeposit/Swap/From')).toHaveTextContent(`0.041 ${fromSymbol}`)
    expect(getByTestId('EarnDeposit/Swap/To')).toHaveTextContent('100.00 USDC')

    expect(getByText('earnFlow.depositBottomSheet.fee')).toBeTruthy()
    expect(getByTestId('EarnDeposit/Fee')).toHaveTextContent(`₱${fiatFee}(0.000006 ${fromSymbol})`)

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

  describe.each([
    {
      testName: 'deposit',
      mode: 'deposit',
      props: mockDepositProps,
      fromTokenAmount: '100',
      fromTokenId: mockArbUsdcTokenId,
      depositTokenAmount: '100',
      swapType: undefined,
    },
    {
      testName: 'same chain swap & deposit',
      mode: 'swap-deposit',
      props: mockSwapDepositProps,
      fromTokenAmount: '0.041',
      fromTokenId: mockArbEthTokenId,
      depositTokenAmount: '99.999',
      swapType: 'same-chain',
    },
    {
      testName: 'cross chain swap & deposit',
      mode: 'swap-deposit',
      props: mockCrossChainProps,
      fromTokenAmount: '0.041',
      fromTokenId: mockCeloTokenId,
      depositTokenAmount: '99.999',
      swapType: 'cross-chain',
    },
  ])('$testName', ({ mode, props, fromTokenAmount, fromTokenId, depositTokenAmount, swapType }) => {
    const fromNetworkId =
      swapType === 'cross-chain' ? NetworkId['celo-alfajores'] : NetworkId['arbitrum-sepolia']
    const expectedAnalyticsProperties = {
      ...commonAnalyticsProperties,
      mode,
      fromTokenAmount,
      fromTokenId,
      depositTokenAmount,
      swapType,
      fromNetworkId,
    }

    it('pressing complete submits action and fires analytics event', () => {
      const store = createMockStore({ tokens: { tokenBalances: mockTokenBalances } })
      const { getByTestId } = render(
        <Provider store={store}>
          <EarnDepositBottomSheet {...props} />
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
            amount: depositTokenAmount,
            pool: mockEarnPositions[0],
            preparedTransactions: getSerializablePreparedTransactions(
              mockPreparedTransaction.transactions
            ),
            mode,
            fromTokenAmount,
            fromTokenId,
          },
        },
      ])
    })

    it('pressing cancel fires analytics event', () => {
      const { getByTestId } = render(
        <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
          <EarnDepositBottomSheet {...props} />
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
          <EarnDepositBottomSheet {...props} />
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
          <EarnDepositBottomSheet {...props} />
        </Provider>
      )

      fireEvent.press(getByTestId('EarnDeposit/TermsAndConditions'))
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        EarnEvents.earn_deposit_terms_and_conditions_press,
        { type: 'providerTermsAndConditions', ...expectedAnalyticsProperties }
      )
      expect(store.getActions()).toEqual([openUrl('termsUrl', true)])
    })

    it('pressing provider docs opens the providers doc URL (when provider does not have terms and conditions)', () => {
      const store = createMockStore({ tokens: { tokenBalances: mockTokenBalances } })
      const { getByTestId } = render(
        <Provider store={store}>
          <EarnDepositBottomSheet
            {...{
              ...props,
              pool: {
                ...props.pool,
                appId: 'beefy',
                dataProps: { ...props.pool.dataProps, termsUrl: undefined },
              },
            }}
          />
        </Provider>
      )

      fireEvent.press(getByTestId('EarnDeposit/ProviderDocuments'))
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        EarnEvents.earn_deposit_terms_and_conditions_press,
        { type: 'providerDocuments', ...expectedAnalyticsProperties, providerId: 'beefy' }
      )
      expect(store.getActions()).toEqual([openUrl('https://docs.beefy.finance/', true)])
    })

    it('pressing app terms and conditions opens the app T&C URL (when provider does not have terms and conditions)', () => {
      const store = createMockStore({ tokens: { tokenBalances: mockTokenBalances } })
      const { getByTestId } = render(
        <Provider store={store}>
          <EarnDepositBottomSheet
            {...{
              ...props,
              pool: {
                ...props.pool,
                appId: 'beefy',
                dataProps: { ...props.pool.dataProps, termsUrl: undefined },
              },
            }}
          />
        </Provider>
      )

      fireEvent.press(getByTestId('EarnDeposit/AppTermsAndConditions'))
      expect(AppAnalytics.track).toHaveBeenCalledWith(
        EarnEvents.earn_deposit_terms_and_conditions_press,
        { type: 'appTermsAndConditions', ...expectedAnalyticsProperties, providerId: 'beefy' }
      )
      expect(store.getActions()).toEqual([openUrl('https://valora.xyz/terms', true)])
    })

    it('shows loading state and buttons are disabled when deposit is submitted', () => {
      const store = createMockStore({
        tokens: { tokenBalances: mockTokenBalances },
        earn: { depositStatus: 'loading' },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <EarnDepositBottomSheet {...props} />
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
          <EarnDepositBottomSheet {...props} />
        </Provider>
      )

      expect(getByTestId('EarnDeposit/GasSubsidized')).toBeTruthy()
      expect(earnUtils.isGasSubsidizedForNetwork).toHaveBeenCalledWith(fromNetworkId)
    })
  })
})
