import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import { mockAccount, mockPrivateDEK } from 'test/values'
import Persona from '../account/Persona'
import { KycStatus } from '../account/reducer'

jest.mock('src/account/Persona')
describe('bug demo', () => {
  const store = createMockStore({
    web3: {
      mtwAddress: mockAccount,
      dataEncryptionKey: mockPrivateDEK,
    },
  })
  it('uses onClick provided', () => {
    const onPress = jest.fn()
    const { debug, getByTestId } = render(
      <Provider store={store}>
        <Persona onPress={onPress} kycStatus={KycStatus.Approved} disabled={false} />
      </Provider>
    )
    debug()
    fireEvent.press(getByTestId('PersonaView')) // this test fails (as one would expect, since the onPress handler is ignored in the mock component)
    expect(onPress).toHaveBeenCalled()
  })

  it('uses onClick provided 2', () => {
    const onPress = jest.fn()
    const { debug, getByTestId } = render(
      <Provider store={store}>
        <Persona onPress={onPress} kycStatus={KycStatus.Approved} disabled={false} />
      </Provider>
    )
    debug()
    fireEvent.press(getByTestId('PersonaButton')) // this test fails (as one would expect, since the onPress handler is ignored in the mock component)
    expect(onPress).toHaveBeenCalled()
  })
})
