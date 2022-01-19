import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import Inquiry from 'react-native-persona'
import { Provider } from 'react-redux'
import Persona, { Props } from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'
import { createPersonaAccount } from 'src/in-house-liquidity'

const FAKE_TEMPLATE_ID = 'fake template id'
jest.mock('react-native-persona')
jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn(() => FAKE_TEMPLATE_ID),
}))

const mockResponse = new Response(null, { status: 201 })
jest.mock('src/in-house-liquidity', () => ({
  createPersonaAccount: jest.fn(() => mockResponse),
}))

const mockInquiryBuilder = {
  fromTemplate: jest.fn().mockReturnThis(),
  referenceId: jest.fn().mockReturnThis(),
  environment: jest.fn().mockReturnThis(),
  iosTheme: jest.fn().mockReturnThis(),
  onSuccess: jest.fn().mockReturnThis(),
  onCancelled: jest.fn().mockReturnThis(),
  onError: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnThis(),
  start: jest.fn().mockReturnThis(),
}
//@ts-ignore Persona doesn't expose the types to cast this mock adequately :\
jest.spyOn(Inquiry, 'fromTemplate').mockReturnValue(mockInquiryBuilder)

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

  it('calls onSuccess callback on inquiry success', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      onSuccess: jest.fn(),
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledWith(FAKE_TEMPLATE_ID)

    expect(mockInquiryBuilder.onSuccess).toHaveBeenCalled()
    expect(personaProps.onSuccess).not.toHaveBeenCalled()
    mockInquiryBuilder.onSuccess.mock.calls?.[0]?.[0]?.()
    expect(personaProps.onSuccess).toHaveBeenCalled()
  })
})
