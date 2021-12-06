import { FetchMock } from 'jest-fetch-mock/types'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import LinkBankAccountScreen from 'src/account/LinkBankAccountScreen'
import { KycStatus } from 'src/account/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { Provider } from 'react-redux'
import { createMockStore } from 'test/utils'
import { mockAccount, mockMnemonic } from 'test/values'

const FAKE_TEMPLATE_ID = 'fake template id'
jest.mock('react-native-persona')
jest.mock('src/firebase/firebase', () => ({
  readOnceFromFirebase: jest.fn(() => FAKE_TEMPLATE_ID),
}))

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
  it('redirects correctly to SupportContact when button is clicked in kycStatus failed state', async () => {
    const store = createMockStore({
      web3: { mtwAddress: mockAccount },
      account: { kycStatus: KycStatus.Failed },
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
  })
  it('switches to the spinner state when the persona button is clicked', async () => {
    const store = createMockStore({
      web3: { mtwAddress: mockAccount },
      account: { kycStatus: undefined },
    })
    const mockFetch = fetch as FetchMock
    mockFetch.mockResponseOnce(JSON.stringify({}), { status: 201 })

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
