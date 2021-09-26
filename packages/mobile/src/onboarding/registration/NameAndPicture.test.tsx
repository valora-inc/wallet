// @ts-ignore
import { toBeDisabled } from '@testing-library/jest-native'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { Screens } from 'src/navigator/Screens'
import NameAndPicture from 'src/onboarding/registration/NameAndPicture'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

expect.extend({ toBeDisabled })

const mockScreenProps = getMockStackScreenProps(Screens.NameAndPicture)

describe('NameAndPictureScreen', () => {
  it('renders correctly', () => {
    const store = createMockStore()
    const tree = renderer.create(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders with an error', () => {
    const store = createMockStore({ alert: { underlyingError: ErrorMessages.INVALID_INVITATION } })
    const tree = renderer.create(
      <Provider store={store}>
        <NameAndPicture {...mockScreenProps} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
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
})
