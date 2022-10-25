import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import SmallButton from 'src/components/SmallButton'
import Touchable from 'src/components/Touchable'

describe('SmallButton', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { UNSAFE_getByType } = render(
        <SmallButton solid={true} onPress={handler} text="SmallButton" />
      )
      fireEvent.press(UNSAFE_getByType(Touchable))
      expect(handler).toBeCalled()
    })
  })
  it('renders with minimum props', () => {
    const { getByText } = render(
      <SmallButton solid={true} onPress={jest.fn()} text="SmallButton" />
    )
    expect(getByText('SmallButton')).toBeTruthy()
  })
  describe('when disabled', () => {
    it('passes them to Touchable', () => {
      const onPress = jest.fn()
      const { UNSAFE_getByType } = render(
        <SmallButton solid={true} disabled={true} onPress={onPress} text="SmallButton">
          <Text>child text</Text>
        </SmallButton>
      )
      expect(UNSAFE_getByType(Touchable).props).toMatchObject({ disabled: true, onPress })
    })
  })

  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const { getByLabelText } = render(
        <SmallButton
          solid={true}
          accessibilityLabel="link"
          onPress={jest.fn()}
          text="SmallButton"
        />
      )

      expect(getByLabelText('link')).toBeTruthy()
    })
  })
})
