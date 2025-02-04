import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Inquiry } from 'react-native-persona'
import { Provider } from 'react-redux'
import Persona, { Props } from 'src/account/Persona'
import { KycStatus } from 'src/account/reducer'
import { createPersonaAccount } from 'src/in-house-liquidity'
import { createMockStore } from 'test/utils'

const FAKE_TEMPLATE_ID = 'fake template id'
jest.mock('react-native-persona')
jest.mock('src/firebase/firebase', () => ({
  getPersonaTemplateId: jest.fn(() => FAKE_TEMPLATE_ID),
}))

jest.mock('src/in-house-liquidity', () => ({
  ...(jest.requireActual('src/in-house-liquidity') as any),
  createPersonaAccount: jest.fn(() => Promise.resolve()),
}))

const mockInquiryBuilder = {
  referenceId: jest.fn().mockReturnThis(),
  accountId: jest.fn().mockReturnThis(),
  environment: jest.fn().mockReturnThis(),
  sessionToken: jest.fn().mockReturnThis(),
  fields: jest.fn().mockReturnThis(),
  iosTheme: jest.fn().mockReturnThis(),
  onComplete: jest.fn().mockReturnThis(),
  onCanceled: jest.fn().mockReturnThis(),
  onError: jest.fn().mockReturnThis(),
  build: jest.fn().mockReturnValue({ start: jest.fn() }),
}

jest.mock('react-native-persona', () => ({
  ...(jest.requireActual('react-native-persona') as any),
  Inquiry: {
    fromTemplate: jest.fn(() => mockInquiryBuilder),
  },
}))

describe('Persona', () => {
  const store = createMockStore()

  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      disabled: false,
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
      disabled: false,
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

  it('calls IHL to create a persona account if persona account not created', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.NotCreated,
      disabled: false,
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

  it('disables the button when the disabled prop is true', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      disabled: true,
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).toBeDisabled())
  })

  it('launches persona on button press', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      disabled: false,
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
      disabled: false,
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledWith(FAKE_TEMPLATE_ID)

    expect(mockInquiryBuilder.onComplete).toHaveBeenCalled()
    expect(personaProps.onSuccess).not.toHaveBeenCalled()
    mockInquiryBuilder.onComplete.mock.calls?.[0]?.[0]?.('', 'completed') // simulate Persona invoking the onSuccess callback with success
    expect(personaProps.onSuccess).toHaveBeenCalled()
  })
  it('calls onCanceled callback on inquiry cancel', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      onCanceled: jest.fn(),
      disabled: false,
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledWith(FAKE_TEMPLATE_ID)

    expect(mockInquiryBuilder.onCanceled).toHaveBeenCalled()
    expect(personaProps.onCanceled).not.toHaveBeenCalled()
    mockInquiryBuilder.onCanceled.mock.calls?.[0]?.[0]?.() // simulate Persona invoking the onCanceled callback
    expect(personaProps.onCanceled).toHaveBeenCalled()
  })
  it('calls onError callback on inquiry failed', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      onError: jest.fn(),
      disabled: false,
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledWith(FAKE_TEMPLATE_ID)

    expect(mockInquiryBuilder.onComplete).toHaveBeenCalled()
    expect(personaProps.onError).not.toHaveBeenCalled()
    mockInquiryBuilder.onComplete.mock.calls?.[0]?.[0]?.('', 'failed') // simulate Persona invoking the onComplete callback with failed
    expect(personaProps.onError).toHaveBeenCalled()
  })
  it('calls onError callback on inquiry error', async () => {
    const personaProps: Props = {
      kycStatus: KycStatus.Created,
      onError: jest.fn(),
      disabled: false,
    }
    const { getByTestId } = render(
      <Provider store={store}>
        <Persona {...personaProps} />
      </Provider>
    )

    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    expect(Inquiry.fromTemplate).toHaveBeenCalledWith(FAKE_TEMPLATE_ID)

    expect(mockInquiryBuilder.onError).toHaveBeenCalled()
    expect(personaProps.onError).not.toHaveBeenCalled()
    mockInquiryBuilder.onError.mock.calls?.[0]?.[0]?.({ message: 'error' }) // simulate Persona invoking the onError callback
    expect(personaProps.onError).toHaveBeenCalled()
  })
})
