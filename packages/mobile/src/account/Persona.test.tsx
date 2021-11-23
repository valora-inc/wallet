import { fireEvent, render } from '@testing-library/react-native'
import { FetchMock } from 'jest-fetch-mock/types'
import * as React from 'react'
import 'react-native'
import Inquiry from 'react-native-persona'
import { Provider } from 'react-redux'
import Persona, { Props } from 'src/account/Persona'
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
  const mockFetch = fetch as FetchMock
  const store = createMockStore({})

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.resetMocks()
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

  it.skip('calls IHL to create a persona account if launching the first time', async () => {
    mockFetch.mockResponseOnce(JSON.stringify({}))
    const personaProps: Props = {
      kycStatus: undefined,
    }
    render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it.skip('launches persona on button press', () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
    }

    const tree = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    fireEvent.press(tree.getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledTimes(1)
  })
})
