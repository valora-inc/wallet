import { render } from '@testing-library/react-native'
import React from 'react'
import { type Recipient } from 'src/recipients/recipient'
import { typeScale } from 'src/styles/fonts'
import Logger from 'src/utils/Logger'
import {
  ReviewContent,
  ReviewDetailsItem,
  ReviewSummaryItem,
  ReviewSummaryItemContact,
  ReviewTransaction,
} from './ReviewTransaction'

jest.mock('src/utils/Logger')

describe('ReviewTransaction', () => {
  it('uses the custom headerAction if provided', async () => {
    const tree = render(
      <ReviewTransaction
        testID="Review"
        title="Custom HeaderAction"
        headerLeftButton={<>Custom Left Button</>}
      >
        <ReviewContent>
          <></>
        </ReviewContent>
      </ReviewTransaction>
    )

    expect(tree.getByTestId('Review')).toHaveTextContent('Custom Left Button')
  })
})

describe('ReviewSummaryItem', () => {
  it('renders the title and optional subtitle', () => {
    const tree = render(
      <ReviewSummaryItem
        testID="MyItem"
        label="Item Label"
        primaryValue="Item Primary Value"
        secondaryValue="Item Secondary Value"
        icon={<>Item Icon</>}
      />
    )

    expect(tree.getByTestId('MyItem/Label')).toHaveTextContent('Item Label')
    expect(tree.getByTestId('MyItem/PrimaryValue')).toHaveTextContent('Item Primary Value')
    expect(tree.getByTestId('MyItem/SecondaryValue')).toHaveTextContent('Item Secondary Value')
    expect(tree.getByTestId('MyItem')).toHaveTextContent('Item Icon')
  })

  it('does not render subtitle if not provided', () => {
    const tree = render(
      <ReviewSummaryItem
        testID="NoSubtitleItem"
        label="Label"
        primaryValue="Primary Value"
        icon={<></>}
      />
    )
    expect(tree.queryByTestId('NoSubtitleItem/SecondaryValue')).toBeNull()
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
      <ReviewSummaryItemContact label="Contact" recipient={recipient} testID="ContactItem" />
    )

    expect(tree.getByTestId('ContactItem/Name/Header')).toHaveTextContent('Contact')
    expect(tree.getByTestId('ContactItem/Name/Title')).toHaveTextContent('John Doe')
    expect(tree.getByTestId('ContactItem/Name/Subtitle')).toHaveTextContent('+111111111')
  })

  it.each([
    {
      phoneNumberType: 'displayNumber',
      displayNumber: '+111111111',
      e164PhoneNumber: '+222222222',
      phoneToShow: '+111111111',
    },

    {
      phoneNumberType: 'e164PhoneNumber',
      displayNumber: undefined,
      e164PhoneNumber: '+222222222',
      phoneToShow: '+222222222',
    },
  ])(
    'displays only $phoneNumberType phone if name is not available',
    ({ displayNumber, e164PhoneNumber, phoneToShow }) => {
      const recipient = { displayNumber, e164PhoneNumber } as Recipient
      const tree = render(
        <ReviewSummaryItemContact label="Contact" recipient={recipient} testID="ContactItem" />
      )

      expect(tree.getByTestId('ContactItem/Phone/Title')).toHaveTextContent(phoneToShow)
      expect(tree.queryByTestId('ContactItem/Phone/Subtitle')).toBeNull()
    }
  )

  it('displays address if name/phone not available', () => {
    const recipient = {
      address: '0x123456789',
    } as Recipient
    const tree = render(
      <ReviewSummaryItemContact label="Contact" recipient={recipient} testID="ContactItem" />
    )

    expect(tree.getByTestId('ContactItem/Address/Title')).toHaveTextContent('0x123456789')
  })

  it('logs an error if no name/phone/address exist', () => {
    const recipient = {} as Recipient
    render(<ReviewSummaryItemContact label="Contact" recipient={recipient} testID="ContactItem" />)
    expect(Logger.error).toHaveBeenCalledTimes(1)
  })
})

describe('ReviewDetailsItem', () => {
  it('renders loading skeleton if isLoading is true', () => {
    const tree = render(
      <ReviewDetailsItem
        isLoading
        testID="LoadingItem"
        label="Loading Label"
        value="Should not show"
      />
    )

    expect(tree.getByTestId('LoadingItem/Loader')).toBeTruthy()
    expect(tree.queryByText('Should not show')).toBeNull()
  })

  it('renders value text if isLoading is false', () => {
    const tree = render(<ReviewDetailsItem testID="DetailsItem" label="Label" value="Value" />)
    expect(tree.queryByTestId('DetailsItem/Loader')).toBeNull()
    expect(tree.getByTestId('DetailsItem/Value')).toHaveTextContent('Value')
  })

  it('applies bold variant if specified', () => {
    const tree = render(
      <ReviewDetailsItem testID="BoldItem" label="Bold Label" value="Bold Value" variant="bold" />
    )
    expect(tree.getByTestId('BoldItem/Label')).toHaveStyle(typeScale.labelSemiBoldMedium)
  })
})
