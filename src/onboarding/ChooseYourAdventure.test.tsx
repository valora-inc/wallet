import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import ChooseYourAdventure from 'src/onboarding/ChooseYourAdventure'
import { createMockStore } from 'test/utils'
import { mockAccount, mockAccount2 } from 'test/values'

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
    fireEvent.press(getByTestId('AdventureCard/0/chooseYourAdventure.options.add'))
    expect(navigateHome).toHaveBeenLastCalledWith({
      params: { initialScreen: Screens.FiatExchange },
    })

    fireEvent.press(getByTestId('AdventureCard/1/chooseYourAdventure.options.learn'))
    expect(navigateHome).toHaveBeenLastCalledWith({
      params: { initialScreen: Screens.ExchangeHomeScreen },
    })
    fireEvent.press(getByTestId('AdventureCard/2/chooseYourAdventure.options.dapp'))
    expect(navigateHome).toHaveBeenLastCalledWith({
      params: { initialScreen: Screens.DAppsExplorerScreen },
    })
    fireEvent.press(getByTestId('AdventureCard/3/chooseYourAdventure.options.profile'))
    expect(navigateHome).toHaveBeenLastCalledWith()
    expect(navigate).toHaveBeenLastCalledWith(Screens.Profile)

    fireEvent.press(getByTestId('AdventureCard/3/chooseYourAdventure.options.profile'))
    expect(navigateHome).toHaveBeenLastCalledWith()
  })
})
