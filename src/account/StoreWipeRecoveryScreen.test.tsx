import { act, fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { startStoreWipeRecovery } from 'src/account/actions'
import StoreWipeRecoveryScreen from 'src/account/StoreWipeRecoveryScreen'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'

const mockAccount = '0x0000000000000000000000000000000000007E57'

jest.mock('src/web3/contracts', () => ({
  ...(jest.requireActual('src/web3/contracts') as any),
  getWalletAsync: jest.fn().mockResolvedValue({
    getAccounts: jest.fn(() => [mockAccount]),
  }),
}))

describe('StoreWipRecoverScreen', () => {
  it('should render the correct elements and navigate to onboarding', async () => {
    const store = createMockStore({})

    const { getByText } = render(
      <Provider store={store}>
        <StoreWipeRecoveryScreen />
      </Provider>
    )

    expect(getByText('storeRecoveryTitle')).toBeTruthy()
    expect(getByText('storeRecoveryBody')).toBeTruthy()

    await act(() => {
      fireEvent.press(getByText('storeRecoveryButton'))
    })

    expect(navigate).toHaveBeenCalledWith(Screens.PincodeSet)
    expect(store.getActions()).toEqual([startStoreWipeRecovery(mockAccount)])
  })
})
