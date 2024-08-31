import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import EarnPoolInfoScreen from 'src/earn/EarnPoolInfoScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockEarnPositions } from 'test/values'

const defaultStore = createMockStore({})

describe('EarnPoolInfoScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const { getByTestId, getByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockEarnPositions[0],
                })}
              />
            )
          }}
        />
      </Provider>
    )

    expect(
      within(getByTestId('TitleSection')).getByText('earnFlow.poolInfoScreen.chainName')
    ).toBeTruthy()

    expect(
      within(getByTestId('TitleSection')).getByText('earnFlow.poolInfoScreen.protocolName')
    ).toBeTruthy()

    expect(
      within(getByTestId('YieldCard')).getAllByText(
        'earnFlow.poolInfoScreen.ratePercent, {"rate":"1.92"}'
      )
    ).toBeTruthy()

    expect(within(getByTestId('TvlCard')).getByText('earnFlow.poolInfoScreen.tvl')).toBeTruthy()
    expect(within(getByTestId('TvlCard')).getByText('₱2,170,560.00')).toBeTruthy()

    expect(
      within(getByTestId('AgeCard')).getByText('duration, {"context":"month","count":5}')
    ).toBeTruthy()

    expect(getByText('earnFlow.poolInfoScreen.withdraw')).toBeTruthy()
    expect(getByText('earnFlow.poolInfoScreen.deposit')).toBeTruthy()
  })

  it('calls navigateToURI when Learn More Touchable is tapped', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockEarnPositions[0],
                })}
              />
            )
          }}
        />
      </Provider>
    )
    fireEvent.press(
      getByText('earnFlow.poolInfoScreen.learnMoreOnProvider, {"providerName":"Aave"}')
    )
    expect(navigateToURI).toHaveBeenCalledWith('https://app.aave.com/?marketName=proto_arbitrum_v3')
    expect(AppAnalytics.track).toHaveBeenCalledWith(EarnEvents.earn_pool_info_view_pool, {
      appId: 'aave',
      positionId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
    })
  })

  it.each([
    {
      testId: 'TvlInfoBottomSheet',
      event: EarnEvents.earn_pool_info_tap_info_icon,
      infoIconTestId: 'TvlInfoIcon',
      type: 'tvl',
    },
    {
      testId: 'AgeInfoBottomSheet',
      event: EarnEvents.earn_pool_info_tap_info_icon,
      infoIconTestId: 'AgeInfoIcon',
      type: 'age',
    },
    {
      testId: 'YieldRateInfoBottomSheet',
      event: EarnEvents.earn_pool_info_tap_info_icon,
      infoIconTestId: 'YieldRateInfoIcon',
      type: 'yieldRate',
    },
  ])('opens $testId and track analytics event', ({ testId, event, infoIconTestId, type }) => {
    const { getByTestId } = render(
      <Provider store={defaultStore}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockEarnPositions[0],
                })}
              />
            )
          }}
        />
      </Provider>
    )
    fireEvent.press(getByTestId(infoIconTestId))
    expect(getByTestId(testId)).toBeVisible()
    expect(AppAnalytics.track).toHaveBeenCalledWith(event, {
      providerId: 'aave',
      poolId: 'arbitrum-sepolia:0x460b97bd498e1157530aeb3086301d5225b91216',
      type,
    })
  })

  it('navigate to EarnEnterAmount when Deposit button is tapped', () => {
    const { getByText } = render(
      <Provider store={defaultStore}>
        <MockedNavigator
          component={() => {
            return (
              <EarnPoolInfoScreen
                {...getMockStackScreenProps(Screens.EarnPoolInfoScreen, {
                  pool: mockEarnPositions[0],
                })}
              />
            )
          }}
        />
      </Provider>
    )
    fireEvent.press(getByText('earnFlow.poolInfoScreen.deposit'))
    expect(navigate).toHaveBeenCalledWith(Screens.EarnEnterAmount, {
      pool: mockEarnPositions[0],
    })
  })
})
