import { render } from '@testing-library/react-native'
import React from 'react'
import { type Recipient } from 'src/recipients/recipient'
import { typeScale } from 'src/styles/fonts'
import {
  ReviewContent,
  ReviewDetailsItem,
  ReviewSummaryItem,
  ReviewSummaryItemContact,
  ReviewTransaction,
} from './ReviewTransaction'

describe('Review', () => {
  it('uses the custom headerAction if provided', async () => {
    const tree = render(
      <ReviewTransaction
        title="Custom HeaderAction"
        headerAction={<>Custom Left Action</>}
        testID="Review"
      >
        <ReviewContent>
          <></>
        </ReviewContent>
      </ReviewTransaction>
    )

    expect(tree.getByTestId('Review')).toHaveTextContent('Custom Left Action')
  })
})

describe('ReviewSummaryItem', () => {
  it('renders the title and optional subtitle', () => {
    const tree = render(
      <ReviewSummaryItem
        header="Item Header"
        title="Item Title"
        subtitle="Item Subtitle"
        icon={<>Item Icon</>}
        testID="MyItem"
      />
    )

    // Check if header, title, and subtitle all exist
    expect(tree.getByTestId('MyItem/Header')).toHaveTextContent('Item Header')
    expect(tree.getByTestId('MyItem/Title')).toHaveTextContent('Item Title')
    expect(tree.getByTestId('MyItem/Subtitle')).toHaveTextContent('Item Subtitle')
    expect(tree.getByTestId('MyItem')).toHaveTextContent('Item Icon')
  })

  it('does not render subtitle if not provided', () => {
    const tree = render(
      <ReviewSummaryItem header="Header" title="Title" icon={<></>} testID="NoSubtitleItem" />
    )
    expect(tree.queryByTestId('NoSubtitleItem/Subtitle')).toBeNull()
  })
})

describe('ReviewSummaryItemContact', () => {
  it('displays name + phone if recipient has a name and phone number', () => {
    const recipient = {
      name: 'John Doe',
      displayNumber: '+111111111',
      e164PhoneNumber: '+222222222',
    } as Recipient
    const tree = render(
      <ReviewSummaryItemContact header="Contact" recipient={recipient} testID="ContactItem" />
    )

    expect(tree.getByTestId('ContactItem/Name/Header')).toHaveTextContent('Contact')
    expect(tree.getByTestId('ContactItem/Name/Title')).toHaveTextContent('John Doe')
    expect(tree.getByTestId('ContactItem/Name/Subtitle')).toHaveTextContent('+111111111')
  })

  it('displays only displayNumber phone if name is not available', () => {
    const recipient = {
      displayNumber: '+111111111',
      e164PhoneNumber: '+222222222',
    } as Recipient
    const tree = render(
      <ReviewSummaryItemContact header="Contact" recipient={recipient} testID="ContactItem" />
    )

    // This means phone is the title, no subtitle
    expect(tree.getByTestId('ContactItem/Phone/Title')).toHaveTextContent('+111111111')
    expect(tree.queryByTestId('ContactItem/Phone/Subtitle')).toBeNull()
  })

  it('displays only e164PhoneNumber phone if name and displayNumber are not available', () => {
    const recipient = {
      e164PhoneNumber: '+222222222',
    } as Recipient
    const tree = render(
      <ReviewSummaryItemContact header="Contact" recipient={recipient} testID="ContactItem" />
    )

    // This means phone is the title, no subtitle
    expect(tree.getByTestId('ContactItem/Phone/Title')).toHaveTextContent('+222222222')
    expect(tree.queryByTestId('ContactItem/Phone/Subtitle')).toBeNull()
  })

  it('displays address if name/phone not available', () => {
    const recipient = {
      address: '0x123456789',
    } as Recipient
    const tree = render(
      <ReviewSummaryItemContact header="Contact" recipient={recipient} testID="ContactItem" />
    )

    expect(tree.getByTestId('ContactItem/Address/Title')).toHaveTextContent('0x123456789')
  })

  it('displays "unknown" if no name/phone/address exist', () => {
    const recipient = {} as Recipient
    const tree = render(
      <ReviewSummaryItemContact header="Contact" recipient={recipient} testID="ContactItem" />
    )

    expect(tree.getByTestId('ContactItem/Unknown/Title')).toHaveTextContent('unknown')
  })
})

describe('ReviewDetailsItem', () => {
  it('renders loading skeleton if isLoading is true', () => {
    const tree = render(
      <ReviewDetailsItem
        isLoading
        label="Loading Label"
        value="Should not show"
        testID="LoadingItem"
      />
    )

    expect(tree.getByTestId('LoadingItem/Loader')).toBeTruthy()
    // The value text is not displayed
    expect(tree.queryByText('Should not show')).toBeNull()
  })

  it('renders value text if isLoading is false', () => {
    const tree = render(<ReviewDetailsItem label="Label" value="Value" testID="DetailsItem" />)
    expect(tree.queryByTestId('DetailsItem/Loader')).toBeNull()
    expect(tree.getByTestId('DetailsItem/Value')).toHaveTextContent('Value')
  })

  it('applies bold variant if specified', () => {
    const tree = render(
      <ReviewDetailsItem label="Bold Label" value="Bold Value" variant="bold" testID="BoldItem" />
    )
    expect(tree.getByTestId('BoldItem/Label')).toHaveStyle(typeScale.labelSemiBoldMedium)
  })
})
