import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import Button, { BtnTypes, TextSizes } from 'src/components/Button'

describe('Button', () => {
  describe('when pressed', () => {
    it('fires the onPress prop', () => {
      const handler = jest.fn()
      const { getByTestId } = render(
        <Button onPress={handler} text="Button" type={BtnTypes.PRIMARY} testID={'TEST'} />
      )
      const button = getByTestId('TEST')

      fireEvent.press(button)
      expect(handler).toBeCalled()
    })
    // react-native-testing-library fireEvent.press simply calls the handler passed into onPress
    // therefore testing press events is not reliable.
    it('multiple times fires once', () => {
      const handler = jest.fn()
      const { getByTestId } = render(
        <Button onPress={handler} text="Button" type={BtnTypes.PRIMARY} testID={'TEST'} />
      )
      const button = getByTestId('TEST')
      fireEvent.press(button)
      fireEvent.press(button)
      fireEvent.press(button)
      expect(handler).toBeCalledTimes(1)
    })

    describe('when disabled', () => {
      it('does not fire onPress', () => {
        const handler = jest.fn()
        const { getByTestId } = render(
          <Button
            disabled={true}
            onPress={handler}
            text="Button"
            type={BtnTypes.PRIMARY}
            testID={'TEST'}
          />
        )
        const button = getByTestId('TEST')
        fireEvent.press(button)
        expect(handler).not.toBeCalled()
      })
    })
  })

  it('renders with minimum props', () => {
    const button = render(<Button onPress={jest.fn()} text="Button" />)
    expect(button.getByText('Button')).toBeTruthy()
  })

  describe('when passed accessibilityLabel', () => {
    it('sets it', () => {
      const { getByLabelText } = render(
        <Button
          accessibilityLabel="link"
          onPress={jest.fn()}
          text="Button"
          type={BtnTypes.PRIMARY}
        />
      )
      expect(getByLabelText('link').children).toContain('Button')
    })
  })
  describe('when type is SECONDARY', () => {
    it('renders', () => {
      const tree = render(<Button onPress={jest.fn()} text="Button" type={BtnTypes.SECONDARY} />)
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when type not given', () => {
    it('defaults to primary', () => {
      const tree = render(<Button onPress={jest.fn()} text={'Button'} />)
      expect(tree).toMatchSnapshot()
    })
  })
  describe('when type is TERTIARY and text size is small', () => {
    it('renders', () => {
      const tree = render(
        <Button
          onPress={jest.fn()}
          text="Button"
          type={BtnTypes.TERTIARY}
          textSize={TextSizes.SMALL}
        />
      )
      expect(tree).toMatchSnapshot()
    })
  })
})
