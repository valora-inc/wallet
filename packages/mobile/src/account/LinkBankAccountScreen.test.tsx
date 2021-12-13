import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import LinkBankAccountScreen from 'src/account/LinkBankAccountScreen'
import { KycStatus } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'

const FAKE_TEMPLATE_ID = 'fake template id'
jest.mock('react-native-persona')
jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn(() => FAKE_TEMPLATE_ID),
}))

const mockResponse = new Response(null, { status: 201 })
jest.mock('src/inHouseLiquidity', () => ({
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
  })
})
