import { render } from '@testing-library/react-native'
import * as React from 'react'
import { ReactTestInstance } from 'react-test-renderer'
import RecipientPicker from 'src/recipients/RecipientPickerV2'
import { mockRecipient, mockRecipient2, mockRecipient3 } from 'test/values'

const mockRecipients = [mockRecipient, mockRecipient2, mockRecipient3]

describe('RecipientPickerV2', () => {
  it('renders all recipients', () => {
    const { getAllByTestId } = render(
      <RecipientPicker
        recipients={mockRecipients}
        onSelectRecipient={jest.fn()}
        selectedRecipient={null}
        isSelectedRecipientLoading={false}
      />
    )

    expect(getAllByTestId('RecipientItem')).toHaveLength(3)
  })

  it('renders all recipients with title', () => {
    const { getAllByTestId, getByText } = render(
      <RecipientPicker
        title="mockRecipientTitle"
        recipients={mockRecipients}
        onSelectRecipient={jest.fn()}
        selectedRecipient={null}
        isSelectedRecipientLoading={false}
      />
    )

    expect(getByText('mockRecipientTitle')).toBeTruthy()
    expect(getAllByTestId('RecipientItem')).toHaveLength(3)
  })

  it('renders all recipients with one recipient selected', () => {
    const { getAllByTestId, queryByTestId } = render(
      <RecipientPicker
        recipients={mockRecipients}
        onSelectRecipient={jest.fn()}
        selectedRecipient={mockRecipient2}
        isSelectedRecipientLoading={false}
      />
    )

    expect(getAllByTestId('RecipientItem')).toHaveLength(3)
    expect(queryByTestId('RecipientItem/ActivityIndicator')).toBeFalsy()
    expect(
      (getAllByTestId('RecipientItem')[0].children[0] as ReactTestInstance).props.style[1]
    ).toBeFalsy()
    expect(
      (getAllByTestId('RecipientItem')[1].children[0] as ReactTestInstance).props.style[1]
    ).toHaveProperty('backgroundColor')
    expect(
      (getAllByTestId('RecipientItem')[2].children[0] as ReactTestInstance).props.style[1]
    ).toBeFalsy()
  })

  it('renders all recipients with one recipient selected and loading', () => {
    const { getAllByTestId, getByTestId } = render(
      <RecipientPicker
        recipients={mockRecipients}
        onSelectRecipient={jest.fn()}
        selectedRecipient={mockRecipient}
        isSelectedRecipientLoading={true}
      />
    )

    expect(getAllByTestId('RecipientItem')).toHaveLength(3)
    expect(getAllByTestId('RecipientItem/ActivityIndicator')).toHaveLength(1)
    expect(
      (getAllByTestId('RecipientItem')[0].children[0] as ReactTestInstance).props.style[1]
    ).toHaveProperty('backgroundColor')
    expect(getAllByTestId('RecipientItem')[0]).toContainElement(
      getByTestId('RecipientItem/ActivityIndicator')
    )
    expect(
      (getAllByTestId('RecipientItem')[1].children[0] as ReactTestInstance).props.style[1]
    ).toBeFalsy()
    expect(
      (getAllByTestId('RecipientItem')[2].children[0] as ReactTestInstance).props.style[1]
    ).toBeFalsy()
  })
})
