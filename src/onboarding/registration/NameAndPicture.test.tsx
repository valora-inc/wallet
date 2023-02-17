import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as AccountActions from 'src/account/actions'
import { Screens } from 'src/navigator/Screens'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import MockedNavigator from 'test/MockedNavigator'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

jest.mock('src/analytics/ValoraAnalytics')

jest.spyOn(AccountActions, 'setName')
const mockScreenProps = getMockStackScreenProps(Screens.NameAndPicture)

describe('NameAndPictureScreen', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('disable button when no name', () => {
    const store = createMockStore()
    const { getByTestId } = render(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )

    expect(getByTestId('NameAndPictureContinueButton')).toBeDisabled()
    // Just spaces counts as empty
    fireEvent.changeText(getByTestId('NameEntry'), '    ')
    expect(getByTestId('NameAndPictureContinueButton')).toBeDisabled()
    fireEvent.changeText(getByTestId('NameEntry'), 'Some Name')
    expect(getByTestId('NameAndPictureContinueButton')).not.toBeDisabled()
  })

  it('is disabled with no text', () => {
    const wrapper = render(
      <Provider store={createMockStore()}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(wrapper.UNSAFE_queryAllByProps({ disabled: true }).length).toBeGreaterThan(0)
  })

  it('saves empty name regardless of what is in the inputbox when skip is used', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <MockedNavigator component={NameAndPicture} />
      </Provider>
    )
    fireEvent.changeText(getByTestId('NameEntry'), 'Some Name')
    fireEvent.press(getByText('skip'))
    expect(AccountActions.setName).not.toHaveBeenCalled()
  })
})
