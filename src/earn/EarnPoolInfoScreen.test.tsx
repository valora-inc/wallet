import { fireEvent, render, within } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import EarnPoolInfoScreen from 'src/earn/EarnPoolInfoScreen'
import { Screens } from 'src/navigator/Screens'
import { navigateToURI } from 'src/utils/linking'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockEarnPositions } from 'test/values'

const defaultStore = createMockStore({})

describe('EarnPoolInfoScreen', () => {
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
      within(getByTestId('YieldCard')).queryAllByText(
        'earnFlow.poolInfoScreen.ratePercent, {"rate":"0.27"}'
      )
    ).toBeTruthy()

    expect(
      within(getByTestId('TvlCard')).queryAllByText('earnFlow.poolInfoScreen.tvl')
    ).toBeTruthy()
    expect(within(getByTestId('TvlCard')).queryAllByText('$328,925.86')).toBeTruthy()

    expect(within(getByTestId('AgeCard')).queryAllByText('3 months')).toBeTruthy()

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
  })
})
