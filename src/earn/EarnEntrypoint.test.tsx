import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnEntrypoint from 'src/earn/EarnEntrypoint'
import { EarnTabType } from 'src/earn/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import { createMockStore } from 'test/utils'
import { mockEarnPositions } from 'test/values'

jest.mock('src/statsig')

function getStore({ hasSuppliedPools = false }: { hasSuppliedPools?: boolean } = {}) {
  return createMockStore({
    positions: {
      positions: [{ ...mockEarnPositions[0], balance: hasSuppliedPools ? '10' : '0' }],
      earnPositionIds: ['arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216'],
    },
  })
}

describe('EarnEntrypoint', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation(
        (featureGateName) => featureGateName === StatsigFeatureGates.SHOW_POSITIONS
      )
  })

  it('renders nothing for UK compliant variant', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_UK_COMPLIANT_VARIANT)

    const { toJSON } = render(
      <Provider store={getStore()}>
        <EarnEntrypoint />
      </Provider>
    )

    expect(toJSON()).toBeNull()
  })

  it('renders correctly when no pools supplied', () => {
    const { getByText } = render(
      <Provider store={getStore()}>
        <EarnEntrypoint />
      </Provider>
    )

    expect(getByText('earnFlow.entrypoint.title')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.description')).toBeTruthy()
  })

  it('navigates to EarnInfoScreen when pressed when no pools supplied', async () => {
    const { getByTestId } = render(
      <Provider store={getStore()}>
        <EarnEntrypoint />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnEntrypoint'))

    expect(navigate).toHaveBeenCalledWith(Screens.EarnInfoScreen)
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_entrypoint_press, {
      hasSuppliedPools: false,
    })
  })
  it('renders total supplied when has pools supplied', () => {
    const { getByTestId, getByText } = render(
      <Provider store={getStore({ hasSuppliedPools: true })}>
        <EarnEntrypoint />
      </Provider>
    )

    expect(getByText('earnFlow.entrypoint.title')).toBeTruthy()
    expect(getByText('earnFlow.entrypoint.totalDepositAndEarnings')).toBeTruthy()
    expect(getByTestId('EarnEntrypoint/TotalSupplied')).toContainElement(getByText('₱15.96'))
  })

  it('navigates to correct tab on touchable press when has pools supplied', () => {
    const { getByTestId } = render(
      <Provider store={getStore({ hasSuppliedPools: true })}>
        <EarnEntrypoint />
      </Provider>
    )

    fireEvent.press(getByTestId('EarnEntrypoint'))
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_entrypoint_press, {
      hasSuppliedPools: true,
    })
    expect(navigate).toHaveBeenCalledWith(Screens.EarnHome, { activeEarnTab: EarnTabType.MyPools })
  })
})
