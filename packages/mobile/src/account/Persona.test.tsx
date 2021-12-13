import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import Inquiry from 'react-native-persona'
import { Provider } from 'react-redux'
import Persona, { Props } from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'
import { createPersonaAccount } from 'src/inHouseLiquidity'

const FAKE_TEMPLATE_ID = 'fake template id'
jest.mock('react-native-persona')
jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn(() => FAKE_TEMPLATE_ID),
}))

const mockResponse = new Response(null, { status: 201 })
jest.mock('src/inHouseLiquidity', () => ({
  createPersonaAccount: jest.fn(() => mockResponse),
}))

describe('Persona', () => {
  const store = createMockStore({
    web3: { mtwAddress: mockAccount },
  })

  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
    }

    const { toJSON } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('calls IHL to create a persona account if launching the first time', async () => {
    const personaProps: Props = {
      kycStatus: undefined,
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )
    // Should be disabled to start because we don't know if they have an account until the IHL call happens
    expect(getByTestId('PersonaButton')).toBeDisabled()

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())
    expect(createPersonaAccount).toHaveBeenCalledTimes(1)
  })

  it('launches persona on button press', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
    }

    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledWith(FAKE_TEMPLATE_ID)
  })
})
