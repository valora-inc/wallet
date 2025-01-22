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
