import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import { TopBarIconButtonV2 } from 'src/navigator/TopBarIconButtonV2'
const testID = 'button'

describe('TopBarIconButtonV2', () => {
  it('renders correctly with given props', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <TopBarIconButtonV2 testID={testID} icon={<Text>IconV2</Text>} onPress={onPress} />
    )
    expect(getByTestId(testID)).toBeTruthy()
    fireEvent.press(getByTestId(testID))
    expect(onPress).toHaveBeenCalled()
  })

  it('handles the disabled state correctly', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <TopBarIconButtonV2
        testID={`${testID}-disabled`}
        icon={<Text>IconV2</Text>}
        onPress={onPress}
        disabled={true}
      />
    )
    fireEvent.press(getByTestId(`${testID}-disabled`))
    expect(onPress).not.toHaveBeenCalled()
  })
})
