import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import { EARN_STABLECOINS_LEARN_MORE } from 'src/config'
import EarnInfoScreen from 'src/earn/EarnInfoScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import networkConfig from 'src/web3/networkConfig'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore } from 'test/utils'

jest.mock('src/statsig', () => ({
  getFeatureGate: jest.fn(),
}))

const store = createMockStore({})

describe('EarnInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', async () => {
    const { getByText, queryByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} />
      </Provider>
    )

    // First details item - includes subsidy code
    expect(getByText('earnFlow.earnInfo.title')).toBeTruthy()
    expect(getByText('earnFlow.earnInfo.details.earn.title')).toBeTruthy()
    expect(queryByText('earnFlow.earnInfo.details.earn.titleGasSubsidy')).toBeFalsy()
    expect(queryByText('earnFlow.earnInfo.details.earn.footnoteSubsidy')).toBeFalsy()

    // Second details item
    expect(
      getByText('earnFlow.earnInfo.details.manage.titleV1_92, {"appName":"Valora"}')
    ).toBeTruthy()
    expect(
      getByText('earnFlow.earnInfo.details.manage.subtitleV1_92, {"appName":"Valora"}')
    ).toBeTruthy()

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
      uri: EARN_STABLECOINS_LEARN_MORE,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_info_learn_press)
  })

  it('should navigate and fire analytics correctly on Start Earning button press', () => {
    const { getByText } = render(
      <Provider store={store}>
        <MockedNavigator component={EarnInfoScreen} />
      </Provider>
    )

    fireEvent.press(getByText('earnFlow.earnInfo.action.earn'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      tokenId: networkConfig.arbUsdcTokenId,
    })
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_info_earn_press)
  })
})
