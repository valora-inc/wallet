import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text, TouchableOpacity } from 'react-native'
import TextInputWithButtons from 'src/components/TextInputWithButtons'

describe('TextInputWithButtons', () => {
  it('renders correctly', () => {
    const onChangeText = jest.fn()
    const testValue = 'TestValue'
    const onPress = jest.fn()

    const { getByTestId, toJSON } = render(
      <TextInputWithButtons onChangeText={onChangeText} value={testValue}>
        <TouchableOpacity testID={'Touchable'} onPress={onPress}>
          <Text>{'Some text'}</Text>
        </TouchableOpacity>
      </TextInputWithButtons>
    )
    expect(toJSON()).toMatchSnapshot()

    fireEvent.press(getByTestId('Touchable'))
    expect(onPress).toHaveBeenCalled()
  })
})
