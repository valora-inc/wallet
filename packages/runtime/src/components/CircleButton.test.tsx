import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import CircleButton from 'src/components/CircleButton'

describe('CircleButton', () => {
  it('renders correctly with minimum props', () => {
    const tree = render(<CircleButton onPress={jest.fn()} solid={true} />)
    expect(tree).toMatchSnapshot()
  })
  describe('when given optional props', () => {
    it('renders correctly', () => {
      const tree = render(
        <CircleButton
          onPress={jest.fn()}
          solid={false}
          style={{ flexDirection: 'column' }}
          size={50}
          borderWidth={3}
          disabled={false}
          activeColor="#333333"
          inactiveColor="#666666"
        />
      )
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when pressed', () => {
    it('calls the onPress prop', () => {
      const onPress = jest.fn()
      const { UNSAFE_getByType } = render(<CircleButton onPress={onPress} solid={true} />)
      fireEvent.press(UNSAFE_getByType(CircleButton))
      expect(onPress).toHaveBeenCalled()
    })
  })
})
