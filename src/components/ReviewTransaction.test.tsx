import { render } from '@testing-library/react-native'
import React from 'react'
import { typeScale } from 'src/styles/fonts'
import {
  ReviewContent,
  ReviewDetailsItem,
  ReviewSummaryItem,
  ReviewTransaction,
} from './ReviewTransaction'

jest.mock('src/utils/Logger')

describe('ReviewTransaction', () => {
  it('uses the custom headerAction if provided', async () => {
    const tree = render(
      <ReviewTransaction
        testID="Review"
        title="Custom HeaderAction"
        headerAction={<>Custom Left Action</>}
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
