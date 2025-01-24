import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { View } from 'react-native'
import {
  SettingsItemCta,
  SettingsItemInput,
  SettingsItemSwitch,
  SettingsItemTextValue,
} from 'src/components/SettingsItem'

const title = 'title'
const testID = 'testID'

describe('SettingsItemTextValue', () => {
  const value = 'value'
  it('renders correctly without value', () => {
    const wrapper = render(<SettingsItemTextValue title={title} />)
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('renders correctly', () => {
    const wrapper = render(<SettingsItemTextValue testID={testID} title={title} value={value} />)
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('reacts on press', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <SettingsItemTextValue testID={testID} title={title} value={value} onPress={onPress} />
    )
    fireEvent.press(getByTestId(testID))
    expect(onPress).toHaveBeenCalled()
  })
})

describe('SettingsItemSwitch', () => {
  const value = true
  const onValueChange = jest.fn()
  it('renders correctly', () => {
    const wrapper = render(
      <SettingsItemSwitch title={title} value={value} onValueChange={onValueChange} />
    )
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('reacts on press', () => {
    const { getByTestId } = render(
      <SettingsItemSwitch
        testID={testID}
        title={title}
        value={value}
        onValueChange={onValueChange}
      />
    )
    fireEvent(getByTestId(testID), 'valueChange', !value)
    expect(onValueChange).toHaveBeenCalledWith(!value)
  })
})

describe('SettingsItemInput', () => {
  const value = 'value'
  const newValue = 'newValue'
  const onValueChange = jest.fn()
  it('renders correctly', () => {
    const wrapper = render(
      <SettingsItemInput
        testID={testID}
        onValueChange={onValueChange}
        title={title}
        value={value}
      />
    )
    expect(wrapper.toJSON()).toMatchSnapshot()
  })

  it('reacts on press', () => {
    const { getByTestId } = render(
      <SettingsItemInput
        testID={testID}
        title={title}
        value={value}
        onValueChange={onValueChange}
      />
    )
    fireEvent(getByTestId(testID), 'changeText', newValue)
    expect(onValueChange).toHaveBeenCalledWith(newValue)
  })
})

describe('SettingsItemCta', () => {
  const mockComponent = <View testID="cta-test"></View>
  it('renders correctly', () => {
    const { getByTestId, getByText } = render(
      <SettingsItemCta testID={testID} title={title} cta={mockComponent} />
    )

    expect(getByText(title)).toBeTruthy()
    expect(getByTestId(`cta-test`)).toBeTruthy()
  })

  it('reacts on press', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <SettingsItemCta testID={testID} title={title} cta={mockComponent} onPress={onPress} />
    )

    fireEvent.press(getByTestId(testID))
    expect(onPress).toHaveBeenCalled()
  })
})
