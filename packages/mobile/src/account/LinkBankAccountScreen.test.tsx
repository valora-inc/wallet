import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import LinkBankAccountScreen, { StepOne } from 'src/account/LinkBankAccountScreen'
import { KycStatus } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { CICOEvents } from 'src/analytics/Events'
import { mockAccount } from 'test/values'
import PersonaButton from './Persona'
import Button from '@celo/react-components/components/Button'

jest.mock('src/analytics/ValoraAnalytics')

let personaButtonSuccessCallback: (() => any) | undefined // using this to simulate Persona success at any arbitrary time
const MockPersona = ({ onSuccess, onPress }: { onSuccess: () => any; onPress: () => any }) => {
  personaButtonSuccessCallback = onSuccess
  return <Button onPress={onPress} text="test persona button" testID="PersonaButton" />
}
jest.mock('./Persona', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}))

const FAKE_TEMPLATE_ID = 'fake template id'
jest.mock('react-native-persona')
jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn(() => FAKE_TEMPLATE_ID),
}))

const mockResponse = new Response(null, { status: 201 })
jest.mock('src/in-house-liquidity', () => ({
  createPersonaAccount: jest.fn(() => mockResponse),
}))

describe('LinkBankAccountScreen', () => {
  beforeEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })
  describe('renders correctly for each possible kycStatus', () => {
    const kycValues: (KycStatus | undefined)[] = Object.values(KycStatus)
    kycValues.push(undefined)
    kycValues.forEach((kycValue) => {
      it(`renders correctly for a KycStatus of ${kycValue}`, () => {
        const store = createMockStore({
          web3: { mtwAddress: mockAccount },
          account: { kycStatus: kycValue },
        })
        const { toJSON } = render(
          <Provider store={store}>
            <LinkBankAccountScreen />
          </Provider>
        )
        expect(toJSON()).toMatchSnapshot()
      })
    })
  })
  describe('redirects correctly to SupportContact when button is clicked', async () => {
    it.each([KycStatus.Failed, KycStatus.Declined])(
      'redirects for a KycStatus of %s',
      (kycValue) => {
        const store = createMockStore({
          web3: { mtwAddress: mockAccount },
          account: { kycStatus: kycValue },
        })
        const tree = render(
          <Provider store={store}>
            <LinkBankAccountScreen />
          </Provider>
        )
        fireEvent.press(tree.getByTestId('SupportContactLink'))
        expect(navigate).toBeCalledWith(Screens.SupportContact, {
          prefilledText: 'linkBankAccountScreen.failed.contactSupportPrefill',
        })
      }
    )
  })
  it('switches to the spinner state when the persona button is clicked', async () => {
    const store = createMockStore({
      web3: { mtwAddress: mockAccount },
      account: { kycStatus: undefined },
    })

    const { getByText, getByTestId } = render(
      <Provider store={store}>
        <LinkBankAccountScreen />
      </Provider>
    )
    await waitFor(() => expect(getByTestId('PersonaButton')).not.toBeDisabled())

    fireEvent.press(getByTestId('PersonaButton'))
    await waitFor(() => getByText('linkBankAccountScreen.verifying.title'))
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(CICOEvents.persona_kyc_start)
  })

  describe('Tests with mock Persona button', () => {
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
  })
})
