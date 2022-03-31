import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import { View } from 'react-native'
import RequestMessagingCard from 'src/components/RequestMessagingCard'

describe(RequestMessagingCard, () => {
  it('renders correctly', () => {
    const onPress = jest.fn()
    const { getByText, getByTestId } = render(
      <RequestMessagingCard
        title="Test"
        amount="$15"
        details="Gold is where you can choose to store Celo dollars you have"
        icon={<View testID="TestIcon" />}
        callToActions={[{ text: 'it goes boom', onPress }]}
      />
    )

    expect(getByText('Test')).toBeDefined()
    expect(getByText('$15')).toBeDefined()
    expect(getByText('Gold is where you can choose to store Celo dollars you have')).toBeDefined()
    expect(getByTestId('TestIcon')).toBeDefined()

    expect(getByText('it goes boom')).toBeDefined()
    fireEvent.press(getByText('it goes boom'))
    expect(onPress).toHaveBeenCalled()
  })
})
