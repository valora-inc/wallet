import Button from '@celo/react-components/components/Button'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import { StepOne, StepTwo } from 'src/account/LinkBankAccountScreen'
import openPlaid from 'src/account/openPlaid'
import { FinclusiveKycStatus, KycStatus } from 'src/account/reducer'
import { CICOEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { createMockStore } from 'test/utils'
import { mockAccount } from 'test/values'
import { fetchFinclusiveKyc } from './actions'
import PersonaButton from './Persona'

let personaButtonSuccessCallback: (() => any) | undefined // using this to simulate Persona success at any arbitrary time
let personaButtonErrorCallback: (() => any) | undefined // using this to simulate Persona error at any arbitrary time
let personaButtonCancelCallback: (() => any) | undefined // using this to simulate Persona cancel at any arbitrary time

const MockPersona = ({
  onSuccess,
  onPress,
  onError,
  onCancelled,
}: {
  onCancelled: () => any
  onError: () => any
  onSuccess: () => any
  onPress: () => any
}) => {
  personaButtonSuccessCallback = onSuccess
  personaButtonErrorCallback = onError
  personaButtonCancelCallback = onCancelled
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
    describe('StepOne', () => {
      it('periodically polls ihl if KycStatus is approved but FinclusiveKycStatus is not', () => {
        jest.useFakeTimers()
        const store = createMockStore({
          account: {
            kycStatus: KycStatus.Approved,
            finclusiveKycStatus: FinclusiveKycStatus.InReview,
          },
        })
        store.dispatch = jest.fn()
        render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        expect(store.dispatch).toHaveBeenCalledWith(fetchFinclusiveKyc())
        jest.advanceTimersByTime(6000)
        expect(store.dispatch).toHaveBeenCalledTimes(2)
      })
      it('does not poll ihl when FinclusiveKycStatus is Accepted', () => {
        jest.useFakeTimers()
        const store = createMockStore({
          account: {
            kycStatus: KycStatus.Approved,
            finclusiveKycStatus: FinclusiveKycStatus.Accepted,
          },
        })
        store.dispatch = jest.fn()
        render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        jest.advanceTimersByTime(6000)
        expect(store.dispatch).toHaveBeenCalledTimes(0)
      })
      it('shows the spinner if the user just clicked persona', async () => {
        const store = createMockStore({
          account: {
            kycStatus: undefined,
            finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
          },
        })
        const { getByText, getByTestId } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.begin.title')).toBeTruthy())
        await fireEvent.press(getByTestId('PersonaButton'))
        await waitFor(() => expect(getByText('linkBankAccountScreen.verifying.title')).toBeTruthy())
      })
      it('shows the pending screen if the user suceeded with Persona', async () => {
        const store = createMockStore({
          account: {
            kycStatus: undefined,
            finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
          },
        })
        const { getByText, getByTestId } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.begin.title')).toBeTruthy())
        await fireEvent.press(getByTestId('PersonaButton'))
        personaButtonSuccessCallback?.()
        await waitFor(() => expect(getByText('linkBankAccountScreen.pending.title')).toBeTruthy())
      })
      it('shows the pending screen if the user has been approved by persona but has not yet started finclusive', async () => {
        const store = createMockStore({
          account: {
            kycStatus: KycStatus.Approved,
            finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
          },
        })
        const { getByText } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.pending.title')).toBeTruthy())
      })
      it('shows the failure screen if the user failed with Persona', async () => {
        const store = createMockStore({
          account: {
            kycStatus: undefined,
            finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
          },
        })
        const { getByText, getByTestId } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.begin.title')).toBeTruthy())
        await fireEvent.press(getByTestId('PersonaButton'))
        personaButtonErrorCallback?.()
        await waitFor(() => expect(getByText('linkBankAccountScreen.failed.title')).toBeTruthy())
        fireEvent.press(getByTestId('SupportContactLink'))
        expect(navigate).toBeCalledWith(Screens.SupportContact, {
          prefilledText: 'linkBankAccountScreen.failed.contactSupportPrefill',
        })
      })
      it('shows the failure screen if the user failed with Finclusive', async () => {
        const store = createMockStore({
          account: {
            kycStatus: KycStatus.Approved,
            finclusiveKycStatus: FinclusiveKycStatus.Rejected,
          },
        })
        const { getByText } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.failed.title')).toBeTruthy())
      })
      it('shows the begin screen again if the persona flow is canceled', async () => {
        const store = createMockStore({
          account: {
            kycStatus: undefined,
            finclusiveKycStatus: FinclusiveKycStatus.NotSubmitted,
          },
        })
        const { getByText, getByTestId } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.begin.title')).toBeTruthy())
        await fireEvent.press(getByTestId('PersonaButton'))
        personaButtonCancelCallback?.()
        await waitFor(() => expect(getByText('linkBankAccountScreen.begin.title')).toBeTruthy())
      })
      it('shows the completed screen if finclusiveKycStatus is Accepted', async () => {
        const store = createMockStore({
          account: {
            kycStatus: KycStatus.Approved,
            finclusiveKycStatus: FinclusiveKycStatus.Accepted,
          },
        })
        const { getByText } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.completed.title')).toBeTruthy())
        await waitFor(() =>
          expect(
            getByText('linkBankAccountScreen.completed.descriptionStep2NotEnabled')
          ).toBeTruthy()
        )
      })
      it('shows the completed screen (with step2 enabled description) when finclusiveKycStatus is Accepted and step2 is enabled', async () => {
        const store = createMockStore({
          account: {
            kycStatus: KycStatus.Approved,
            finclusiveKycStatus: FinclusiveKycStatus.Accepted,
          },
          app: { linkBankAccountStepTwoEnabled: true },
        })
        const { getByText } = render(
          <Provider store={store}>
            <StepOne />
          </Provider>
        )
        await waitFor(() => expect(getByText('linkBankAccountScreen.completed.title')).toBeTruthy())
        await waitFor(() =>
          expect(getByText('linkBankAccountScreen.completed.description')).toBeTruthy()
        )
      })
    })
    describe('StepTwo', () => {
      it('step two is disabled when feature flag is switched off (even if kyc approved)', async () => {
        const store = createMockStore({
          web3: { mtwAddress: mockAccount },
          account: { finclusiveKycStatus: FinclusiveKycStatus.Accepted },
          app: { linkBankAccountStepTwoEnabled: false },
        })

        const { getByTestId, queryByText } = render(
          <Provider store={store}>
            <StepTwo />
          </Provider>
        )
        const plaidLinkButton = getByTestId('PlaidLinkButton')
        expect(queryByText('linkBankAccountScreen.stepTwo.disabledTitle')).toBeTruthy()
        expect(queryByText('linkBankAccountScreen.stepTwo.disabledDescription')).toBeTruthy()
        expect(queryByText('linkBankAccountScreen.stepTwo.disabledCta')).toBeTruthy()
        expect(plaidLinkButton).toBeDisabled()
      })
      it('step two is disabled when feature flag is switched on and kyc is not approved', async () => {
        const store = createMockStore({
          web3: { mtwAddress: mockAccount },
          account: { finclusiveKycStatus: FinclusiveKycStatus.Submitted },
          app: { linkBankAccountStepTwoEnabled: true },
        })

        const { getByTestId } = render(
          <Provider store={store}>
            <StepTwo />
          </Provider>
        )
        const plaidLinkButton = getByTestId('PlaidLinkButton')
        expect(plaidLinkButton).toBeDisabled()
      })
      it('step two is enabled when feature flag is switched on and kyc is approved', async () => {
        const store = createMockStore({
          web3: { mtwAddress: mockAccount },
          account: { finclusiveKycStatus: FinclusiveKycStatus.Accepted },
          app: { linkBankAccountStepTwoEnabled: true },
        })

        const { getByTestId, queryByText } = render(
          <Provider store={store}>
            <StepTwo />
          </Provider>
        )
        const plaidLinkButton = getByTestId('PlaidLinkButton')
        expect(queryByText('linkBankAccountScreen.stepTwo.title')).toBeTruthy()
        expect(queryByText('linkBankAccountScreen.stepTwo.description')).toBeTruthy()
        expect(queryByText('linkBankAccountScreen.stepTwo.cta')).toBeTruthy()
        expect(plaidLinkButton).not.toBeDisabled()
      })
      it('Calls openPlaid when the plaid button is clicked', async () => {
        const mockWalletAddress = '0x123'
        const store = createMockStore({
          web3: {
            account: mockWalletAddress,
          },
          i18n: {
            language: 'en-US',
          },
          account: {
            e164PhoneNumber: MOCK_PHONE_NUMBER,
            finclusiveKycStatus: FinclusiveKycStatus.Accepted,
          },
          app: { linkBankAccountStepTwoEnabled: true },
        })
        const { getByTestId } = render(
          <Provider store={store}>
            <StepTwo />
          </Provider>
        )
        await waitFor(() => expect(getByTestId('PlaidLinkButton')).not.toBeDisabled())

        await fireEvent.press(getByTestId('PlaidLinkButton'))

        expect(ValoraAnalytics.track).toHaveBeenCalledWith(
          CICOEvents.add_initial_bank_account_start
        )
        expect(openPlaid).toHaveBeenCalledWith({
          walletAddress: mockWalletAddress,
          locale: 'en-US',
          phoneNumber: MOCK_PHONE_NUMBER,
          onSuccess: expect.any(Function),
          onExit: expect.any(Function),
        })
      })
    })
  })
})
