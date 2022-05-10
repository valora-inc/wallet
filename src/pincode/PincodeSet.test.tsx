import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { navigate, navigateClearingStack, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { DEFAULT_CACHE_ACCOUNT, updatePin } from 'src/pincode/authentication'
import { setCachedPin } from 'src/pincode/PasswordCache'
import PincodeSet from 'src/pincode/PincodeSet'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mockAccount } from 'test/values'

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

  it('navigates to the VerificationEducationScreen screen after successfully verifying', async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet, { komenciAvailable: true })
    const mockStore = createMockStore({
      app: {
        hideVerification: false,
      },
    })

    const { getByTestId, rerender } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()
    expect(mockScreenProps.navigation.setParams).toBeCalledWith({ isVerifying: true })

    rerender(
      <Provider store={mockStore}>
        <PincodeSet
          {...getMockStackScreenProps(Screens.PincodeSet, {
            isVerifying: true,
            komenciAvailable: true,
          })}
        />
      </Provider>
    )

    // Verify pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(navigateClearingStack).toBeCalledWith(Screens.VerificationEducationScreen)
  })

  it('navigates home if Komenci is unavailable or verification is disabled', async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet, { komenciAvailable: false })
    const mockStore = createMockStore({
      app: {
        hideVerification: true,
      },
    })
    mockStore.dispatch = jest.fn()

    const { getByTestId, rerender } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()
    expect(mockScreenProps.navigation.setParams).toBeCalledWith({ isVerifying: true })

    rerender(
      <Provider store={mockStore}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet, { isVerifying: true })} />
      </Provider>
    )

    // Verify pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(navigateHome).toBeCalled()
    expect(mockStore.dispatch).not.toHaveBeenCalledWith({
      status: true,
      type: 'IDENTITY/SET_SEEN_VERIFICATION_NUX',
    })
  })

  it('navigates home if skipVerification is enabled', async () => {
    const mockScreenProps = getMockStackScreenProps(Screens.PincodeSet, { komenciAvailable: true })
    const mockStore = createMockStore({
      app: {
        skipVerification: true,
        hideVerification: false,
      },
    })
    mockStore.dispatch = jest.fn()

    const { getByTestId, rerender } = render(
      <Provider store={mockStore}>
        <PincodeSet {...mockScreenProps} />
      </Provider>
    )

    // Create pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()
    expect(mockScreenProps.navigation.setParams).toBeCalledWith({ isVerifying: true })

    rerender(
      <Provider store={mockStore}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet, { isVerifying: true })} />
      </Provider>
    )

    // Verify pin
    mockPin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(navigateHome).toBeCalled()
    expect(mockStore.dispatch).toHaveBeenCalledWith({
      status: true,
      type: 'IDENTITY/SET_SEEN_VERIFICATION_NUX',
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
    expect(mockScreenProps.navigation.setParams).toBeCalledWith({ isVerifying: true })

    rerender(
      <Provider store={mockStore}>
        <PincodeSet {...getMockStackScreenProps(Screens.PincodeSet, { isVerifying: true })} />
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
        <PincodeSet
          {...getMockStackScreenProps(Screens.PincodeSet, { isVerifying: true, changePin: true })}
        />
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
