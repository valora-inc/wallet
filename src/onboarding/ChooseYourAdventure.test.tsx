import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { FiatExchangeFlow } from 'src/fiatExchanges/utils'
import {
  navigate,
  navigateClearingStack,
  navigateHome,
  navigateHomeAndThenToScreen,
} from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ChooseYourAdventure from 'src/onboarding/ChooseYourAdventure'
import { AdventureCardName } from 'src/onboarding/types'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockCeloTokenId } from 'test/values'

describe('ChooseYourAdventure', () => {
  const orderOptions = [
    {
      address: mockAccount,
      testIDs: [
        'AdventureCard/0/chooseYourAdventure.options.dapp',
        'AdventureCard/1/chooseYourAdventure.options.add',
        'AdventureCard/2/chooseYourAdventure.options.learn',
        'AdventureCard/3/chooseYourAdventure.options.profile',
      ],
    },
    {
      address: mockAccount2,
      testIDs: [
        'AdventureCard/0/chooseYourAdventure.options.learn',
        'AdventureCard/1/chooseYourAdventure.options.profile',
        'AdventureCard/2/chooseYourAdventure.options.dapp',
        'AdventureCard/3/chooseYourAdventure.options.add',
      ],
    },
  ]

  const expectedCardOrder = [
    AdventureCardName.Dapp,
    AdventureCardName.Add,
    AdventureCardName.Learn,
    AdventureCardName.Profile,
  ]

  const store = createMockStore({
    web3: {
      account: mockAccount,
    },
  })

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

  it('navigates to the correct screen for dapp', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ChooseYourAdventure />
      </Provider>
    )

    fireEvent.press(getByTestId('AdventureCard/0/chooseYourAdventure.options.dapp'))
    expect(navigateClearingStack).toHaveBeenLastCalledWith(Screens.TabNavigator, {
      initialScreen: Screens.TabDiscover,
    })
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      position: 1,
      cardName: AdventureCardName.Dapp,
      cardOrder: expectedCardOrder,
    })
  })

  it('navigates to the correct screen for add', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ChooseYourAdventure />
      </Provider>
    )
    fireEvent.press(getByTestId('AdventureCard/1/chooseYourAdventure.options.add'))
    expect(navigateHome).toHaveBeenLastCalledWith()
    expect(navigate).toHaveBeenCalledWith(Screens.FiatExchangeCurrencyBottomSheet, {
      flow: FiatExchangeFlow.CashIn,
    })
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      position: 2,
      cardName: AdventureCardName.Add,
      cardOrder: expectedCardOrder,
    })
  })

  it('navigates to the correct screen for learn', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ChooseYourAdventure />
      </Provider>
    )
    fireEvent.press(getByTestId('AdventureCard/2/chooseYourAdventure.options.learn'))
    expect(navigateHomeAndThenToScreen).toHaveBeenLastCalledWith(Screens.TokenDetails, {
      tokenId: mockCeloTokenId,
    })
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      position: 3,
      cardName: AdventureCardName.Learn,
      cardOrder: expectedCardOrder,
    })
  })

  it('navigates to the correct screen for profile', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ChooseYourAdventure />
      </Provider>
    )
    fireEvent.press(getByTestId('AdventureCard/3/chooseYourAdventure.options.profile'))
    expect(navigateHomeAndThenToScreen).toHaveBeenLastCalledWith(Screens.Profile)
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_button_press, {
      position: 4,
      cardName: AdventureCardName.Profile,
      cardOrder: expectedCardOrder,
    })
  })

  it('navigates to the correct screen for later', () => {
    const { getByTestId } = render(
      <Provider store={store}>
        <ChooseYourAdventure />
      </Provider>
    )
    fireEvent.press(getByTestId('ChooseYourAdventure/Later'))
    expect(navigateHome).toHaveBeenLastCalledWith()
    expect(ValoraAnalytics.track).toHaveBeenLastCalledWith(OnboardingEvents.cya_later, {
      cardOrder: expectedCardOrder,
    })
  })
})
