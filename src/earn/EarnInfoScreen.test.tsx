import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnInfoScreen from 'src/earn/EarnInfoScreen'
import { EarnTabType } from 'src/earn/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'
import { mockEarnPositions } from 'test/values'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
  getDynamicConfigParams: jest.fn().mockReturnValue({
    links: {
      earnStablecoinsLearnMore: 'https://example.com/earn',
    },
  }),
}))

const store = createMockStore({
  positions: {
    positions: mockEarnPositions,
    earnPositionIds: mockEarnPositions.map((p) => p.positionId),
  },
})

describe('EarnInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_POSITIONS)
  })

  it('should render correctly', async () => {
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} />
      </Provider>
    )

    // First details item - includes subsidy code
    expect(getByText('earnFlow.earnInfo.title')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.work.title')).toBeTruthy()
    expect(queryByText('earnFlow.earnInfo.details.earn.titleGasSubsidy')).toBeFalsy()
    expect(queryByText('earnFlow.earnInfo.details.earn.footnoteSubsidy')).toBeFalsy()

    // Second details item
    expect(getByText('earnFlow.earnInfo.details.manage.titleV1_94')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.manage.subtitleV1_94')).toBeTruthy()

    // Third details item
    expect(getByText('earnFlow.earnInfo.details.access.title')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.access.subtitle')).toBeTruthy()

    // Buttons
    expect(getByText('earnFlow.earnInfo.action.learn')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.action.earn')).toBeTruthy()
  })

  it('should navigate and fire analytics correctly on Learn More button press', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.earnInfo.action.learn'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: 'https://example.com/earn',
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_info_learn_press)
  })

  it('should navigate and fire analytics correctly on Start Earning button press', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SHOW_POSITIONS)
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.earnInfo.action.earn'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnHome, {
      activeEarnTab: EarnTabType.AllPools,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_info_earn_press)
  })
})
