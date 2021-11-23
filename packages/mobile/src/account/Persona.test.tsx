import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import Inquiry from 'react-native-persona'
import { Provider } from 'react-redux'
import Persona from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { createMockStore } from 'test/utils'
import { mockMnemonic } from 'test/values'

jest.mock('react-native-persona')

jest.mock('src/backup/utils', () => ({
  ...(jest.requireActual('src/backup/utils') as any),
  getStoredMnemonic: jest.fn(() => mockMnemonic),
}))

jest.mock('@celo/utils/lib/signatureUtils', () => {
  const mockSignMessage = jest.fn(() => 'fake signature')
  const mockSerializeSignature = jest.fn(() => 'fake serialized signature')
  return {
    serializeSignature: mockSerializeSignature,
    signMessage: mockSignMessage,
  }
})

describe('Persona', () => {
  const store = createMockStore({})

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const personaProps = {
      KycStatus: KycStatus.Created,
    }
    const { toJSON } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })

  it('calls IHL to create a persona account if launching the first time', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch')

    const personaProps = {
      KycStatus: undefined,
    }
    const tree = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(fetchSpy).toHaveBeenCalled())
  })

  it('launches persona on button press', () => {
    const personaProps = {
      KycStatus: KycStatus.Created,
    }

    const tree = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('PersonaButton'))
    expect(Inquiry).toHaveBeenCalled()
  })
})
