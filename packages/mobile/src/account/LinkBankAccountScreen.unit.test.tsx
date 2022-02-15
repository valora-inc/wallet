import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { StepOne, StepTwo } from 'src/account/LinkBankAccountScreen'
import { KycStatus } from 'src/account/reducer'
import PersonaButton from './Persona'
import Button from '@celo/react-components/components/Button'
import openPlaid from 'src/account/openPlaid'
import { createMockStore } from 'test/utils'
import { mockAccount, mockPrivateDEK } from 'test/values'
import { Provider } from 'react-redux'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOEvents } from 'src/analytics/Events'

let personaButtonSuccessCallback: (() => any) | undefined // using this to simulate Persona success at any arbitrary time
const MockPersona = ({ onSuccess, onPress }: { onSuccess: () => any; onPress: () => any }) => {
  personaButtonSuccessCallback = onSuccess
  return <Button onPress={onPress} text="test persona button" testID="PersonaButton" />
}

const MOCK_PHONE_NUMBER = '+18487623478'

jest.mock('src/analytics/ValoraAnalytics')

jest.mock('./Persona', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}))

jest.mock('src/account/openPlaid', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}))

describe('LinkBankAccountScreen: unit tests (test one component at a time)', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  describe('Tests with mock Persona button and openPlaid', () => {
    beforeAll(() => {
      //@ts-ignore . my IDE complains about this, though jest allows it
      PersonaButton.mockImplementation(MockPersona)
    })
    afterEach(() => {
      personaButtonSuccessCallback = undefined
    })
    afterAll(() => {
      jest.clearAllMocks()
    })
    it('switches to completed state when persona onSuccess callback is called and kyc exists', async () => {
      const { getByText, getByTestId, rerender } = render(<StepOne kycStatus={undefined} />)
      await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

      await fireEvent.press(getByTestId('PersonaButton'))
      await waitFor(() => getByText('linkBankAccountScreen.verifying.title'))

      rerender(<StepOne kycStatus={KycStatus.Approved} />) // simulating the redux store being updated to reflect new KYC status. in a production flow Persona calls an IHL webhook, which updates firebase, which triggers a redux store update

      expect(personaButtonSuccessCallback).toBeTruthy()
      personaButtonSuccessCallback?.()
      await waitFor(() => getByText('linkBankAccountScreen.completed.title')) // spinny wheel gone
    })
    it('Calls openPlaid when the plaid button is clicked', async () => {
      const store = createMockStore({
        web3: {
          mtwAddress: mockAccount,
          dataEncryptionKey: mockPrivateDEK,
        },
        i18n: {
          language: 'en-US',
        },
        account: {
          e164PhoneNumber: MOCK_PHONE_NUMBER,
        },
      })
      const { getByTestId } = render(
        <Provider store={store}>
          <StepTwo disabled={false} />
        </Provider>
      )
      await waitFor(() => expect(getByTestId('PlaidLinkButton')).not.toBeDisabled())

      await fireEvent.press(getByTestId('PlaidLinkButton'))

      expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.add_initial_bank_account_start)
      expect(openPlaid).toHaveBeenCalledWith({
        accountMTWAddress: mockAccount,
        locale: 'en-US',
        phoneNumber: MOCK_PHONE_NUMBER,
        dekPrivate: mockPrivateDEK,
        onSuccess: expect.any(Function),
        onExit: expect.any(Function),
      })
    })
  })
})
