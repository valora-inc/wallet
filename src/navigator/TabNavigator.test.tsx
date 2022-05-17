import 'react-native'

// This avoids rendering WalletHome as we're mostly interested in testing the menu here
jest.mock('src/home/WalletHome')
describe('TabNavigator', () => {
  // TODO: need to add tests here now that the DrawerNavigator no longer displays balances
  it.todo('renders correctly')
})
