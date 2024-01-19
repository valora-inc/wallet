import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { View } from 'react-native'
import SimpleMessagingCard from 'src/components/SimpleMessagingCard'

describe(SimpleMessagingCard, () => {
  it('renders correctly', () => {
    const onPress = jest.fn()
    const { getByText, getByTestId } = render(
      <SimpleMessagingCard
        header="Header"
        text="Test"
        icon={<View testID="TestIcon" />}
        callToActions={[{ text: 'it goes boom', onPress }]}
      />
    )

    expect(getByText('Header')).toBeDefined()
    expect(getByText('Test')).toBeDefined()
    expect(getByTestId('TestIcon')).toBeDefined()

    expect(getByText('it goes boom')).toBeDefined()
    fireEvent.press(getByText('it goes boom'))
    expect(onPress).toHaveBeenCalled()
  })

  it('renders remote icons', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <SimpleMessagingCard
        text="Test"
        icon={{ uri: 'https://example.com/icon.png' }}
        callToActions={[{ text: 'it goes boom', onPress }]}
        testID="Card"
      />
    )

    const icon = getByTestId('Card/Icon')
    expect(icon.props.source).toEqual({ uri: 'https://example.com/icon.png' })
  })

  it('hides the icon when not set', () => {
    const onPress = jest.fn()
    const { queryByTestId } = render(
      <SimpleMessagingCard
        text="Test"
        callToActions={[{ text: 'it goes boom', onPress }]}
        testID="Card"
      />
    )

    expect(queryByTestId('Card/Icon')).toBeNull()
  })
})
