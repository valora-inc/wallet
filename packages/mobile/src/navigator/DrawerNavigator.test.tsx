import { NavigationContainer } from '@react-navigation/native'
import { render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import DrawerNavigator from 'src/navigator/DrawerNavigator'
import { createMockStore } from 'test/utils'

// This avoids rendering WalletHome as we're mostly interested in testing the menu here
jest.mock('src/home/WalletHome')
describe('DrawerNavigator', () => {
  it('renders correctly ', () => {
    const store = createMockStore({})

    const tree = render(
      <Provider store={store}>
        <NavigationContainer>
          <DrawerNavigator />
        </NavigationContainer>
      </Provider>
    )

    expect(tree).toMatchSnapshot()
    // TODO: need to add tests here now that the DrawerNavigator no longer displays balances
  })
})
