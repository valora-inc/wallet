import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import RecipientItem from 'src/recipients/RecipientItemV2'
import { createMockStore } from 'test/utils'
import { mockInvitableRecipient } from 'test/values'

describe('RecipientItemV2', () => {
  it('renders correctly with no valora icon if phone number recipient is not a known valora user (number never looked up)', () => {
    const { queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          identity: {
            e164NumberToAddress: {},
          },
        })}
      >
        <RecipientItem
          recipient={mockInvitableRecipient}
          onSelectRecipient={jest.fn()}
          loading={false}
        />
      </Provider>
    )
    expect(getByText(mockInvitableRecipient.name)).toBeTruthy()
    expect(getByText(mockInvitableRecipient.displayNumber)).toBeTruthy()
    expect(queryByTestId('RecipientItem/ValoraIcon')).toBeFalsy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with no valora icon if phone number recipient is not a known valora user (number looked up before)', () => {
    const { queryByTestId, getByText } = render(
      <Provider
        store={createMockStore({
          identity: {
            e164NumberToAddress: { [mockInvitableRecipient.e164PhoneNumber]: null },
          },
        })}
      >
        <RecipientItem
          recipient={mockInvitableRecipient}
          onSelectRecipient={jest.fn()}
          loading={false}
        />
      </Provider>
    )
    expect(getByText(mockInvitableRecipient.name)).toBeTruthy()
    expect(getByText(mockInvitableRecipient.displayNumber)).toBeTruthy()
    expect(queryByTestId('RecipientItem/ValoraIcon')).toBeFalsy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with valora icon if phone number recipient is a valora user', () => {
    const { queryByTestId, getByText, getByTestId } = render(
      // default store includes a cached mapping
      <Provider store={createMockStore()}>
        <RecipientItem
          recipient={mockInvitableRecipient}
          onSelectRecipient={jest.fn()}
          loading={false}
        />
      </Provider>
    )
    expect(getByText(mockInvitableRecipient.name)).toBeTruthy()
    expect(getByText(mockInvitableRecipient.displayNumber)).toBeTruthy()
    expect(getByTestId('RecipientItem/ValoraIcon')).toBeTruthy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly if loading is set to true', () => {
    const { getByText, getByTestId } = render(
      <Provider store={createMockStore()}>
        <RecipientItem
          recipient={mockInvitableRecipient}
          onSelectRecipient={jest.fn()}
          loading={true}
        />
      </Provider>
    )
    expect(getByText(mockInvitableRecipient.name)).toBeTruthy()
    expect(getByText(mockInvitableRecipient.displayNumber)).toBeTruthy()
    expect(getByTestId('RecipientItem/ActivityIndicator')).toBeTruthy()
  })

  it('tapping item invokes onSelectRecipient', () => {
    const mockSelectRecipient = jest.fn()
    const { getByTestId } = render(
      <Provider store={createMockStore()}>
        <RecipientItem
          recipient={mockInvitableRecipient}
          onSelectRecipient={mockSelectRecipient}
          loading={false}
        />
      </Provider>
    )
    fireEvent.press(getByTestId('RecipientItem'))
    expect(mockSelectRecipient).toHaveBeenLastCalledWith(mockInvitableRecipient)
  })
})
