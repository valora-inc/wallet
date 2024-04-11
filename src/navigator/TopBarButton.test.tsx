import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'
import { TopBarIconButton, TopBarIconButtonV2, TopBarTextButton } from 'src/navigator/TopBarButton'
const testID = 'button'

describe('TopBarTextButton', () => {
  it('renders with minimum props', () => {
    const onPress = jest.fn()
    const { queryByText } = render(
      <TopBarTextButton testID={testID} title={'label'} onPress={onPress} />
    )
    expect(queryByText('label')?.props.children).toEqual('label')
  })

  it('fires an event when pressed', () => {
    const onPress = jest.fn()
    const { queryByTestId } = render(
      <TopBarTextButton testID={testID} title={'label'} onPress={onPress} />
    )
    fireEvent.press(queryByTestId(testID)!)
    expect(onPress).toBeCalled()
  })
})

describe('TopBarIconButton', () => {
  it('renders with minimum props', () => {
    const onPress = jest.fn()
    const { queryByText } = render(
      <TopBarIconButton testID={testID} icon={<Text>icon</Text>} onPress={onPress} />
    )
    expect(queryByText('icon')?.props.children).toEqual('icon')
  })

  it('fires an event when pressed', () => {
    const onPress = jest.fn()
    const { queryByTestId } = render(
      <TopBarIconButton testID={testID} icon={<Text>icon</Text>} onPress={onPress} />
    )
    fireEvent.press(queryByTestId(testID)!)
    expect(onPress).toBeCalled()
  })
})

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
