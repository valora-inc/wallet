import { fireEvent, render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { PROVIDER_ID } from 'src/earn/constants'
import { depositStart } from 'src/earn/slice'
import { navigate } from 'src/navigator/NavigationService'
import { getDynamicConfigParams, getFeatureGate } from 'src/statsig'
import { StatsigDynamicConfigs, StatsigFeatureGates } from 'src/statsig/types'
import { NetworkId } from 'src/transactions/types'
import { PreparedTransactionsPossible } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransactions } from 'src/viem/preparedTransactionSerialization'
import { createMockStore, mockStoreBalancesToTokenBalances } from 'test/utils'
import { mockArbEthTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

const mockPreparedTransaction: PreparedTransactionsPossible = {
  type: 'possible' as const,
  transactions: [
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(5e16),
      _baseFeePerGas: BigInt(1),
      maxFeePerGas: BigInt(1),
      maxPriorityFeePerGas: undefined,
    },
    {
      from: '0xfrom',
      to: '0xto',
      data: '0xdata',
      gas: BigInt(1e16),
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

const mockToken = mockStoreBalancesToTokenBalances([mockTokenBalances[mockArbEthTokenId]])[0]

describe('EarnDepositBottomSheet', () => {
  const expectedAnalyticsProperties = {
    depositTokenId: mockArbEthTokenId,
    tokenAmount: '100',
    networkId: NetworkId['arbitrum-sepolia'],
    providerId: PROVIDER_ID,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getDynamicConfigParams).mockImplementation(({ configName, defaultValues }) => {
      switch (configName) {
        case StatsigDynamicConfigs.EARN_STABLECOIN_CONFIG:
          return {
            providerName: 'Aave',
            providerLogoUrl: 'logoUrl',
            providerTermsAndConditionsUrl: 'termsUrl',
          }
        default:
          return defaultValues
      }
    })
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('renders all elements', () => {
    const { getByTestId, queryByTestId, getByText } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )
    expect(getByText('earnFlow.depositBottomSheet.title')).toBeTruthy()
    expect(getByText('earnFlow.depositBottomSheet.description')).toBeTruthy()

    expect(getByTestId('EarnDepositBottomSheet/EarnApyAndAmount/Apy/Loading')).toBeTruthy()
    expect(getByTestId('EarnDepositBottomSheet/EarnApyAndAmount/EarnUpTo/Loading')).toBeTruthy()

    expect(queryByTestId('EarnDeposit/GasSubsidized')).toBeFalsy()

    expect(getByText('earnFlow.depositBottomSheet.amount')).toBeTruthy()
    expect(getByTestId('EarnDeposit/Amount')).toHaveTextContent('100.00 ETH')

    expect(getByText('earnFlow.depositBottomSheet.fee')).toBeTruthy()
    expect(getByTestId('EarnDeposit/Fee')).toHaveTextContent('0.06 ETH')

    expect(getByText('earnFlow.depositBottomSheet.provider')).toBeTruthy()
    expect(getByText('Aave')).toBeTruthy()
    expect(getByTestId('EarnDeposit/ProviderInfo')).toBeTruthy()

    expect(getByText('earnFlow.depositBottomSheet.network')).toBeTruthy()
    expect(getByText('Arbitrum Sepolia')).toBeTruthy()

    expect(getByText('earnFlow.depositBottomSheet.footer')).toBeTruthy()

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
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/PrimaryCta'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_complete,
      expectedAnalyticsProperties
    )
    expect(store.getActions()).toEqual([
      {
        type: depositStart.type,
        payload: {
          amount: '100',
          tokenId: mockArbEthTokenId,
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
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/SecondaryCta'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_cancel,
      expectedAnalyticsProperties
    )
  })

  it('pressing provider info opens the terms and conditions', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/ProviderInfo'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      EarnEvents.earn_deposit_provider_info_press,
      expectedAnalyticsProperties
    )
    expect(navigate).toHaveBeenCalledWith('WebViewScreen', { uri: 'termsUrl' })
  })

  it('pressing terms and conditions opens the terms and conditions', () => {
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnDeposit/TermsAndConditions'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
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
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )

    expect(getByTestId('EarnDeposit/PrimaryCta')).toBeDisabled()
    expect(getByTestId('EarnDeposit/SecondaryCta')).toBeDisabled()
    expect(getByTestId('EarnDeposit/PrimaryCta')).toContainElement(getByTestId('Button/Loading'))
  })

  it('shows gas subsidized copy if feature gate is set', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) =>
          featureGateName === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES
      )
    const { getByTestId } = render(
      <Provider store={createMockStore({ tokens: { tokenBalances: mockTokenBalances } })}>
        <EarnDepositBottomSheet
          forwardedRef={{ current: null }}
          amount={new BigNumber(100)}
          preparedTransaction={mockPreparedTransaction}
          token={mockToken}
          networkId={NetworkId['arbitrum-sepolia']}
        />
      </Provider>
    )

    expect(getByTestId('EarnDeposit/GasSubsidized')).toBeTruthy()
  })
})
