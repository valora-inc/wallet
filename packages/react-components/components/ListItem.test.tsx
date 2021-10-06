import ListItem from '@celo/react-components/components/ListItem'
import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'

const testID = 'ListItemTestID'

describe('ListItem', () => {
  it('renders correctly', () => {
    const onPress = jest.fn()
    const tree = render(<ListItem children={<Text>test</Text>} onPress={onPress} />)
    expect(tree).toMatchSnapshot()
  })

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
