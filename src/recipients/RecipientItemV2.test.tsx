import { fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import RecipientItem from 'src/recipients/RecipientItemV2'
import { createMockStore } from 'test/utils'
import {
  mockAddressRecipient,
  mockInvitableRecipient,
  mockPhoneRecipient,
  mockRecipient,
} from 'test/values'

describe('RecipientItemV2', () => {
  it('renders correctly with no app icon if phone number recipient is not a known app user (number never looked up)', () => {
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
    expect(queryByTestId('RecipientItem/AppIcon')).toBeFalsy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with no app icon if phone number recipient is not a known app user (number looked up before)', () => {
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
    expect(queryByTestId('RecipientItem/AppIcon')).toBeFalsy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with app icon if phone number recipient is an app user', () => {
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
    expect(getByTestId('RecipientItem/AppIcon')).toBeTruthy()
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
  })

  it('renders correctly with app icon if address recipient is an app user', () => {
    const { queryByTestId, getByText, getByTestId } = render(
      // default store includes a cached mapping
      <Provider
        store={createMockStore({
          identity: {
            addressToVerificationStatus: {
              [mockRecipient.address]: true,
            },
          },
        })}
      >
        <RecipientItem recipient={mockRecipient} onSelectRecipient={jest.fn()} loading={false} />
      </Provider>
    )
    expect(getByText(mockRecipient.name)).toBeTruthy()
    expect(getByTestId('RecipientItem/AppIcon')).toBeTruthy()
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

  it('renders correct icon when recipient is a phone number', () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createMockStore()}>
        <RecipientItem
          recipient={mockPhoneRecipient}
          onSelectRecipient={jest.fn()}
          loading={false}
        />
      </Provider>
    )
    expect(getByTestId('RecipientItem/PhoneIcon')).toBeTruthy()
    expect(queryByTestId('RecipientItem/WalletIcon')).toBeFalsy()
  })

  it('renders correct icon when recipient is an address', () => {
    const { queryByTestId, getByTestId } = render(
      <Provider store={createMockStore()}>
        <RecipientItem
          recipient={mockAddressRecipient}
          onSelectRecipient={jest.fn()}
          loading={false}
        />
      </Provider>
    )
    expect(getByTestId('RecipientItem/WalletIcon')).toBeTruthy()
    expect(queryByTestId('RecipientItem/PhoneIcon')).toBeFalsy()
  })
})
