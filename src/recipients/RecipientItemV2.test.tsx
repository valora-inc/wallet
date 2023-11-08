import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import RecipientItem from 'src/recipients/RecipientItemV2'
import { mockRecipient } from 'test/values'

describe('RecipientItemV2', () => {
  it('renders correctly with no icon or loading state', () => {
    const { queryByTestId, getByText } = render(
      <RecipientItem recipient={mockRecipient} onSelectRecipient={jest.fn()} loading={false} />
    )
    expect(getByText(mockRecipient.name)).toBeTruthy()
    expect(getByText(mockRecipient.displayNumber)).toBeTruthy()
    expect(queryByTestId('RecipientItem/ValoraIcon')).toBeFalsy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with icon and no loading state', () => {
    const { queryByTestId, getByText, getByTestId } = render(
      <RecipientItem
        recipient={mockRecipient}
        onSelectRecipient={jest.fn()}
        loading={false}
        showValoraIcon={true}
      />
    )
    expect(getByText(mockRecipient.name)).toBeTruthy()
    expect(getByText(mockRecipient.displayNumber)).toBeTruthy()
    expect(getByTestId('RecipientItem/ValoraIcon')).toBeTruthy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with no icon and loading state', () => {
    const { queryByTestId, getByText, getByTestId } = render(
      <RecipientItem
        recipient={mockRecipient}
        onSelectRecipient={jest.fn()}
        loading={true}
        showValoraIcon={false}
      />
    )
    expect(getByText(mockRecipient.name)).toBeTruthy()
    expect(getByText(mockRecipient.displayNumber)).toBeTruthy()
    expect(getByTestId('RecipientItem/ActivityIndicator')).toBeTruthy()
    expect(queryByTestId('RecipientItem/ValoraIcon')).toBeFalsy()
  })

  it('tapping item invokes onSelectRecipient', () => {
    const mockSelectRecipient = jest.fn()
    const { getByTestId } = render(
      <RecipientItem
        recipient={mockRecipient}
        onSelectRecipient={mockSelectRecipient}
        loading={false}
      />
    )
    fireEvent.press(getByTestId('RecipientItem'))
    expect(mockSelectRecipient).toHaveBeenLastCalledWith(mockRecipient)
  })
})
