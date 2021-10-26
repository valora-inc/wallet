import Button from '@celo/react-components/components/Button'
import * as React from 'react'
import 'react-native'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { sendEmail } from 'src/account/emailSender'
import RaiseLimitScreen from 'src/account/RaiseLimitScreen'
import { KycStatus } from 'src/account/reducer'
import { DEFAULT_DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { PaymentInfo } from 'src/send/reducers'
import { createMockStore } from 'test/utils'

const createStore = (
  numberVerified: boolean,
  kycStatus?: KycStatus,
  recentPayments: PaymentInfo[] = []
) =>
  createMockStore({
    app: { numberVerified },
    account: { kycStatus },
    send: { recentPayments },
  })

jest.mock('src/firebase/firebase')
jest.mock('src/account/emailSender')

describe('RaiseLimitScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders correctly', () => {
    const tree = renderer.create(
      <Provider store={createStore(true)}>
        <RaiseLimitScreen />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it("shows the 'Confirm Number' button and navigate to the Phone Confirmation flow when the user hasn't completed KYC and doesn't have a confirmed phonen number", async () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createStore(false)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('ConfirmNumberButton')).toBeDefined()
    fireEvent.press(getByTestId('ConfirmNumberButton'))
    expect(navigate).toHaveBeenCalledWith(Screens.VerificationEducationScreen)
  })

  it("shows the Persona 'Verify Identity' button when the user hasn't completed KYC and has a confirmed phone number", async () => {
    const { queryByTestId } = render(
      <Provider store={createStore(true, KycStatus.Created)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByTestId('PersonaButton')).toBeDefined()
  })

  it("shows the 'Contact Support' button and perpares an email to be sent when the user's KYC submission has been denied", async () => {
    const { queryByTestId, getByTestId, queryByText } = render(
      <Provider store={createStore(true, KycStatus.Failed)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(queryByText('Verification Denied')).toBeDefined()
    expect(queryByTestId('ContactSupportButton')).toBeDefined()
    fireEvent.press(getByTestId('ContactSupportButton'))
    expect(sendEmail).toHaveBeenCalled()
  })

  it('shows correct UI when the user has completed KYC', async () => {
    const tree = render(
      <Provider store={createStore(true, KycStatus.Completed)}>
        <RaiseLimitScreen />
      </Provider>
    )

    // Current Daily Limit should be `unlimited`
    expect(tree.queryByText('Unlimited')).toBeDefined()
    expect(tree.queryByType(Button)).toBeNull()
    expect(tree.queryByText('Verification Complete')).toBeDefined()
  })

  it('shows correct UI when the user has pending KYC', async () => {
    const tree = render(
      <Provider store={createStore(true, KycStatus.Pending)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(tree.queryByType(Button)).toBeNull()
    expect(tree.queryByText('Verification In Progress')).toBeDefined()
  })

  it('shows the correct remaining transfer limit when a user has made no recent payments', async () => {
    const tree = render(
      <Provider store={createStore(true)}>
        <RaiseLimitScreen />
      </Provider>
    )

    expect(tree.queryByText(DEFAULT_DAILY_PAYMENT_LIMIT_CUSD.toFixed(2))).toBeDefined()
  })

  it('shows the correct remaining transfer limit when a user has made recent payments', async () => {
    const recentPaymentAmount = 100

    const tree = render(
      <Provider
        store={createStore(true, undefined, [
          {
            timestamp: Date.now(),
            amount: recentPaymentAmount,
          },
        ])}
      >
        <RaiseLimitScreen />
      </Provider>
    )

    expect(
      tree.queryByText((DEFAULT_DAILY_PAYMENT_LIMIT_CUSD - recentPaymentAmount).toFixed(2))
    ).toBeDefined()
  })

  it("shows 'no limit' when a user has completed KYC ", async () => {
    const recentPaymentAmount = 100

    const tree = render(
      <Provider
        store={createStore(true, KycStatus.Completed, [
          {
            timestamp: Date.now(),
            amount: recentPaymentAmount,
          },
        ])}
      >
        <RaiseLimitScreen />
      </Provider>
    )

    expect(tree.queryByText('noDailyLimit')).toBeDefined()
  })
})
