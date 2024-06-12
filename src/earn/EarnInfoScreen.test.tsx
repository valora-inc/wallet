import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { EarnEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { EARN_STABLECOINS_LEARN_MORE } from 'src/config'
import EarnInfoScreen from 'src/earn/EarnInfoScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
}))

const store = createMockStore({})
const tokenId = networkConfig.arbUsdcTokenId

describe('EarnInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly when no gas subsidy', async () => {
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} params={{ tokenId }} />
      </Provider>
    )

    // First details item - includes subsidy code
    expect(getByText('earnFlow.earnInfo.title')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.earn.title')).toBeTruthy()
    expect(queryByText('earnFlow.earnInfo.details.earn.titleGasSubsidy')).toBeFalsy()
    expect(queryByText('earnFlow.earnInfo.details.earn.footnoteSubsidy')).toBeFalsy()

    // Second details item
    expect(getByText('earnFlow.earnInfo.details.manage.title')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.manage.subtitle')).toBeTruthy()

    // Third details item
    expect(getByText('earnFlow.earnInfo.details.access.title')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.access.subtitle')).toBeTruthy()

    // Buttons
    expect(getByText('earnFlow.earnInfo.action.learn')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.action.earn')).toBeTruthy()
  })

  it('should render correctly when gas subsidy enabled', () => {
    jest
      .mocked(getFeatureGate)
      .mockImplementation((gate) => gate === StatsigFeatureGates.SUBSIDIZE_STABLECOIN_EARN_GAS_FEES)

    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} params={{ tokenId }} />
      </Provider>
    )

    expect(getByText('earnFlow.earnInfo.details.earn.titleGasSubsidy')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.earn.footnoteSubsidy')).toBeTruthy()
    expect(queryByText('earnFlow.earnInfo.details.earn.title')).toBeFalsy()
  })

  it('should navigate and fire analytics correctly on Learn More button press', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} params={{ tokenId }} />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.earnInfo.action.learn'))
    expect(navigate).toHaveBeenCalledWith(Screens.WebViewScreen, {
      uri: EARN_STABLECOINS_LEARN_MORE,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_info_learn_press)
  })

  it('should navigate and fire analytics correctly on Start Earning button press', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} params={{ tokenId }} />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.earnInfo.action.earn'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      tokenId,
    })
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_info_earn_press, { tokenId })
  })
})
