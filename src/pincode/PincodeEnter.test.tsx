import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Provider } from 'react-redux'
import { AuthenticationEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Screens } from 'src/navigator/Screens'
import { checkPin } from 'src/pincode/authentication'
import PincodeEnter from 'src/pincode/PincodeEnter'
import { createMockStore, flushMicrotasksQueue, getMockStackScreenProps } from 'test/utils'
import { mocked } from 'ts-jest/utils'

jest.mock('src/analytics/ValoraAnalytics')

const mockedCheckPin = mocked(checkPin)
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
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(mockScreenProps.route.params.onSuccess).toBeCalledWith(pin)
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_start
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_complete
    )
  })

  it('shows wrong PIN notification', async () => {
    mockedCheckPin.mockResolvedValue(false)
    const { getByTestId, getByText } = renderComponentWithMockStore()

    pin.split('').forEach((number) => fireEvent.press(getByTestId(`digit${number}`)))
    jest.runOnlyPendingTimers()
    await flushMicrotasksQueue()

    expect(getByText(`${ErrorMessages.INCORRECT_PIN}`)).toBeDefined()
    expect(store.getActions()).toEqual([])
    expect(ValoraAnalytics.track).toHaveBeenCalledTimes(2)
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_start
    )
    expect(ValoraAnalytics.track).toHaveBeenCalledWith(
      AuthenticationEvents.get_pincode_with_input_error
    )
  })
})
