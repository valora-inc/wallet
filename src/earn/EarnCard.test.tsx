import { render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnCardDiscover } from 'src/earn/EarnCard'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import networkConfig from 'src/web3/networkConfig'
import { createMockStore } from 'test/utils'
import { mockArbUsdcTokenId, mockTokenBalances } from 'test/values'

jest.mock('src/statsig')

const mockDepositTokenId = mockArbUsdcTokenId
const mockPoolTokenId = networkConfig.aaveArbUsdcTokenId

describe('EarnCardDiscover', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(getFeatureGate).mockReturnValue(false)
  })

  it('renders EarnEntrypoint when multiple pools is enabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS
      )

    const { getByTestId, queryByTestId } = render(
      <Provider store={createMockStore()}>
        <EarnCardDiscover depositTokenId={mockDepositTokenId} poolTokenId={mockPoolTokenId} />
      </Provider>
    )

    expect(getByTestId('EarnEntrypoint')).toBeTruthy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })

  it('renders EarnActivePools when multiple pools is enabled and there are active pools', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS
      )

    const { getByTestId, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [mockPoolTokenId]: {
                ...mockTokenBalances[mockArbUsdcTokenId],
                tokenId: mockPoolTokenId,
                balance: '10',
              },
            },
          },
        })}
      >
        <EarnCardDiscover depositTokenId={mockDepositTokenId} poolTokenId={mockPoolTokenId} />
      </Provider>
    )

    expect(getByTestId('EarnActivePools')).toBeTruthy()
    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    expect(getFeatureGate).toHaveBeenCalledTimes(1)
  })

  it('renders EarnCta when multiple pools is disabled and show stable coin earn is enabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_STABLECOIN_EARN
      )

    const { getByTestId, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: { [mockPoolTokenId]: mockTokenBalances[mockArbUsdcTokenId] },
          },
        })}
      >
        <EarnCardDiscover depositTokenId={mockDepositTokenId} poolTokenId={mockPoolTokenId} />
      </Provider>
    )

    expect(getByTestId('EarnCta')).toBeTruthy()
    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_STABLECOIN_EARN)
    expect(getFeatureGate).toHaveBeenCalledTimes(2)
  })

  it('renders EarnActivePool when multiple pools is disabled and show stable coin earn is enabled and pool token has balance', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_STABLECOIN_EARN
      )

    const { getByTestId, queryByTestId } = render(
      <Provider
        store={createMockStore({
          tokens: {
            tokenBalances: {
              [mockPoolTokenId]: {
                ...mockTokenBalances[mockArbUsdcTokenId],
                tokenId: mockPoolTokenId,
                balance: '10',
              },
            },
          },
        })}
      >
        <EarnCardDiscover depositTokenId={mockDepositTokenId} poolTokenId={mockPoolTokenId} />
      </Provider>
    )

    expect(getByTestId('EarnActivePool')).toBeTruthy()
    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_STABLECOIN_EARN)
    expect(getFeatureGate).toHaveBeenCalledTimes(3)
  })

  it('renders nothing if multiple pools and show stable coin earn are disabled', () => {
    const { queryByTestId } = render(
      <Provider store={createMockStore()}>
        <EarnCardDiscover depositTokenId={mockArbUsdcTokenId} poolTokenId={mockArbUsdcTokenId} />
      </Provider>
    )

    expect(queryByTestId('EarnEntryPoint')).toBeFalsy()
    expect(queryByTestId('EarnActivePools')).toBeFalsy()
    expect(queryByTestId('EarnCta')).toBeFalsy()
    expect(queryByTestId('EarnActivePool')).toBeFalsy()
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_MULTIPLE_EARN_POOLS)
    expect(getFeatureGate).toHaveBeenCalledWith(StatsigFeatureGates.SHOW_STABLECOIN_EARN)
    expect(getFeatureGate).toHaveBeenCalledTimes(2)
  })
})
