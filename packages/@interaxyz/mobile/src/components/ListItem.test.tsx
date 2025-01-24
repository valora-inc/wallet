import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import ListItem from 'src/components/ListItem'

const testID = 'ListItemTestID'

describe('ListItem', () => {
  it('call onPress', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <ListItem testID={testID} children={<Text>test</Text>} onPress={onPress} />
    )

    const el = getByTestId(testID)
    fireEvent.press(el)
    expect(onPress).toHaveBeenCalled()
  })
})
