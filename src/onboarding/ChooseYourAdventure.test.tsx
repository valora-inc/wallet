import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ChooseYourAdventure, { AdventureCardName } from 'src/onboarding/ChooseYourAdventure'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2 } from 'test/values'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { OnboardingEvents } from 'src/analytics/Events'

jest.mock('src/analytics/ValoraAnalytics')

describe('ChooseYourAdventure', () => {
  const orderOptions = [
    {
      address: mockAccount,
      testIDs: [
        'AdventureCard/0/chooseYourAdventure.options.add',
        'AdventureCard/1/chooseYourAdventure.options.learn',
        'AdventureCard/2/chooseYourAdventure.options.dapp',
        'AdventureCard/3/chooseYourAdventure.options.profile',
      ],
    },
    {
      address: mockAccount2,
      testIDs: [
        'AdventureCard/0/chooseYourAdventure.options.dapp',
        'AdventureCard/1/chooseYourAdventure.options.profile',
        'AdventureCard/2/chooseYourAdventure.options.learn',
        'AdventureCard/3/chooseYourAdventure.options.add',
      ],
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each(orderOptions)(
    'shows the elements in a random order seeded by walletAddress',
    ({ address, testIDs }) => {
      const store = createMockStore({
        web3: {
          account: address,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <ChooseYourAdventure />
        </Provider>
      )
      testIDs.forEach((id) => {
        expect(getByTestId(id)).toBeTruthy()
      })
    }
  )

  it('navigates to the correct screens when clicking all the elements', () => {
    const store = createMockStore({
      web3: {
        account: mockAccount,
      },
    })
    const { getByTestId } = render(
      <Provider store={store}>
        <ChooseYourAdventure />
      </Provider>
    )
    const expectedIndexMap = {
      0: AdventureCardName.Add,
      1: AdventureCardName.Learn,
      2: AdventureCardName.Dapp,
      3: AdventureCardName.Profile,
    }

    fireEvent.press(getByTestId('AdventureCard/0/chooseYourAdventure.options.add'))
    expect(navigateHome).toHaveBeenLastCalledWith({
      params: { initialScreen: Screens.FiatExchange },
    })
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      index: 0,
      name: AdventureCardName.Add,
      indexMap: expectedIndexMap,
    })
    fireEvent.press(getByTestId('AdventureCard/1/chooseYourAdventure.options.learn'))
    expect(navigateHome).toHaveBeenLastCalledWith({
      params: { initialScreen: Screens.ExchangeHomeScreen },
    })

    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      index: 1,
      name: AdventureCardName.Learn,
      indexMap: expectedIndexMap,
    })

    fireEvent.press(getByTestId('AdventureCard/2/chooseYourAdventure.options.dapp'))
    expect(navigateHome).toHaveBeenLastCalledWith({
      params: { initialScreen: Screens.DAppsExplorerScreen },
    })
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      index: 2,
      name: AdventureCardName.Dapp,
      indexMap: expectedIndexMap,
    })

    fireEvent.press(getByTestId('AdventureCard/3/chooseYourAdventure.options.profile'))
    expect(navigateHome).toHaveBeenLastCalledWith()
    expect(navigate).toHaveBeenLastCalledWith(Screens.Profile)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      index: 3,
      name: AdventureCardName.Profile,
      indexMap: expectedIndexMap,
    })

    fireEvent.press(getByTestId('AdventureCard/3/chooseYourAdventure.options.profile'))
    expect(navigateHome).toHaveBeenLastCalledWith()

    fireEvent.press(getByTestId('ChooseYourAdventure/Later'))
    expect(navigateHome).toHaveBeenLastCalledWith()
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_later)
  })
})
