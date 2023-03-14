import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { goToNextOnboardingScreen } from 'src/onboarding/steps'
import { DEFAULT_CACHE_ACCOUNT, updatePin } from 'src/pincode/authentication'
import { setCachedPin } from 'src/pincode/PasswordCache'
import PincodeSet from 'src/pincode/PincodeSet'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mockAccount, mockOnboardingProps } from 'test/values'

jest.mock('src/onboarding/steps', () => ({
  goToNextOnboardingScreen: jest.fn(),
  getOnboardingStepValues: () => ({ step: 1, totalSteps: 2 }),
  onboardingPropsSelector: () => mockOnboardingProps,
}))

const mockPin = '364141' // Last 6 hexidecimal values of the secp256k1 group order.

describe('Pincode', () => {
  const mockDispatch = jest.fn()
  let dispatchSpy: any
  beforeAll(() => {
    dispatchSpy = jest
      .spyOn(getMockStackScreenProps(Screens.PincodeSet).navigation, 'dispatch')
      .mockImplementation(mockDispatch)
  })

  afterAll(() => dispatchSpy.mockRestore())

  it('renders the correct components', () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet)
    const mockStore = createMockStore()

    const { getByTestId } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    expect(getByTestId('PincodeDisplay')).toBeTruthy()
    Array.from(Array(10).keys()).forEach((number) => {
      expect(getByTestId(`digit${number}`)).toBeTruthy()
    })
  })

  it('calls goToNextOnboardingScreen after successfully verifying', async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet)
    const mockStore = createMockStore()

    const { getByTestId, rerender } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    rerender(
      <Provider store={mockStore}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet)} />
      </Provider>
    )

    // Verify pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(goToNextOnboardingScreen).toBeCalledWith({
      firstScreenInCurrentStep: Screens.PincodeSet,
      onboardingProps: mockOnboardingProps,
    })
  })

  it('displays an error text when setting a blocked PIN', async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet)
    const mockStore = createMockStore()

    const { getByTestId, getByText } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    '123456'.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()
    expect(getByText('pincodeSet.invalidPin')).toBeDefined()
  })

  it("displays an error text when the pins don't match", async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet)
    const mockStore = createMockStore()

    const { getByTestId, getByText, rerender } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    rerender(
      <Provider store={mockStore}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet)} />
      </Provider>
    )

    // Verify with incorrect pin
    '555555'.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()
    expect(getByText('pincodeSet.pinsDontMatch')).toBeDefined()
  })

  it('navigates back to the Settings screen after successfully changing PIN', async () => {
    const mockStore = createMockStore({
      web3: {
        account: mockAccount,
      },
    })

    const oldPin = '856201'
    setCachedPin(DEFAULT_CACHE_ACCOUNT, oldPin)
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet, { changePin: true })

    const { getByTestId, rerender } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Change pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    rerender(
      <Provider store={mockStore}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet, { changePin: true })} />
      </Provider>
    )

    // Verify pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(updatePin).toHaveBeenCalledWith(mockAccount.toLowerCase(), oldPin, mockPin)
    expect(navigate).toBeCalledWith(Screens.Settings)
  })
})
