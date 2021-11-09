import 'react-native'

// This avoids rendering WalletHome as we're mostly interested in testing the menu here
jest.mock('src/home/WalletHome')
describe('DrawerNavigator', () => {
  it('renders correctly ', () => {
    // const store = createMockStore({})
    // const tree = render(
    //   <Provider store={store}>
    //     <NavigationContainer>
    //       <DrawerNavigator />
    //     </NavigationContainer>
    //   </Provider>
    // )
    // tests for displaying balances moved to BalancesDisplay.test.tsx
    // TODO: need to add tests here now that the DrawerNavigator no longer displays balances
  })
})
