import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { AuthenticationEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Screens } from 'src/navigator/Screens'
import { checkPin } from 'src/pincode/authentication'
import PincodeEnter from 'src/pincode/PincodeEnter'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/analytics/AppAnalytics')

const mockedCheckPin = jest.mocked(checkPin)
const mockScreenProps = getMockStackScreenProps(Screens.PincodeEnter, {
  withVerification: true,
  onSuccess: jest.fn(),
  onCancel: jest.fn(),
})
const store = createMockStore()

const pin = '123456'

const renderComponentWithMockStore = () =>
  render(
    <Provider store={store}>
      <PincodeEnter {...mockScreenProps} />
    </Provider>
  )

describe('PincodeEnter', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the correct components', () => {
    const { getByTestId, getByText } = renderComponentWithMockStore()

    expect(getByText('confirmPin.title')).toBeTruthy()
    expect(getByTestId('PincodeDisplay')).toBeTruthy()
    Array.from(Array(10).keys()).forEach((number) => {
      expect(getByTestId(`digit${number}`)).toBeTruthy()
    })
  })

  it('calls onSuccess when PIN is correct', async () => {
    mockedCheckPin.mockResolvedValueOnce(true)
    const { getByTestId } = renderComponentWithMockStore()

    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))

    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(mockScreenProps.route.params.onSuccess).toBeCalledWith(pin)
    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_start
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_complete
    )
  })

  it('shows wrong PIN notification', async () => {
    mockedCheckPin.mockResolvedValue(false)
    const { getByTestId, getByText } = renderComponentWithMockStore()

    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    await act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(getByText(`${ErrorMessages.INCORRECT_PIN}`)).toBeDefined()
    expect(store.getActions()).toEqual([])
    expect(AppAnalytics.track).toHaveBeenCalledTimes(2)
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_start
    )
    expect(AppAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_error
    )
  })
})
