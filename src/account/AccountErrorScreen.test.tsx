import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import AccountErrorScreen from 'src/account/AccountErrorScreen'

const onPressSpy = jest.fn()
const onSecondaryPressSpy = jest.fn()

const defaultProps = {
  title: 'title',
  testID: 'test id',
  description: 'description',
  onPress: onPressSpy,
  buttonLabel: 'button label',
  onPressSecondary: onSecondaryPressSpy,
  secondaryButtonLabel: 'secondary button label',
}

describe('AccountErrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the correct elements', () => {
    const { getByText } = render(<AccountErrorScreen {...defaultProps} />)

    expect(getByText('title')).toBeTruthy()
    expect(getByText('description')).toBeTruthy()
    expect(getByText('button label')).toBeTruthy()
    expect(getByText('secondary button label')).toBeTruthy()
  })

  it('should handle primary on press', () => {
    const { getByText } = render(<AccountErrorScreen {...defaultProps} />)

    fireEvent.press(getByText('button label'))

    expect(onPressSpy).toHaveBeenCalledTimes(1)
  })

  it('should handle secondary press', () => {
    const { getByText } = render(<AccountErrorScreen {...defaultProps} />)

    fireEvent.press(getByText('secondary button label'))

    expect(onSecondaryPressSpy).toHaveBeenCalledTimes(1)
  })
})
