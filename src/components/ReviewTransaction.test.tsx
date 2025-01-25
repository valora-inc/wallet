import { render } from '@testing-library/react-native'
import BigNumber from 'bignumber.js'
import React from 'react'
import { View } from 'react-native'
import { Provider } from 'react-redux'
import { LocalCurrencySymbol } from 'src/localCurrency/consts'
import { type Recipient } from 'src/recipients/recipient'
import { typeScale } from 'src/styles/fonts'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { createMockStore } from 'test/utils'
import { mockCeloTokenId, mockCusdTokenId, mockTokenBalances } from 'test/values'
import {
  ReviewContent,
  ReviewDetailsItem,
  ReviewSummaryItem,
  ReviewSummaryItemContact,
  ReviewTotalValue,
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
    const tree = render(<ReviewSummaryItemContact recipient={recipient} testID="ContactItem" />)

    expect(tree.getByTestId('ContactItem/PrimaryValue')).toHaveTextContent('John Doe')
    expect(tree.getByTestId('ContactItem/SecondaryValue')).toHaveTextContent('+111111111')
  })

  it.each([
    {
      phoneNumberType: 'displayNumber',
      displayNumber: '+111111111',
      e164PhoneNumber: '+222222222',
      expectedDisplayedValue: '+111111111',
    },

    {
      phoneNumberType: 'e164PhoneNumber',
      displayNumber: undefined,
      e164PhoneNumber: '+222222222',
      expectedDisplayedValue: '+222222222',
    },
  ])(
    'displays only $phoneNumberType phone if name is not available',
    ({ displayNumber, e164PhoneNumber, expectedDisplayedValue }) => {
      const recipient = { displayNumber, e164PhoneNumber } as Recipient
      const tree = render(<ReviewSummaryItemContact recipient={recipient} testID="ContactItem" />)

      expect(tree.getByTestId('ContactItem/PrimaryValue')).toHaveTextContent(expectedDisplayedValue)
      expect(tree.queryByTestId('ContactItem/SecondaryValue')).toBeNull()
    }
  )

  it('displays address if name/phone not available', () => {
    const recipient = {
      address: '0x123456789',
    } as Recipient
    const tree = render(<ReviewSummaryItemContact recipient={recipient} testID="ContactItem" />)

    expect(tree.getByTestId('ContactItem/PrimaryValue')).toHaveTextContent('0x123456789')
  })

  it('logs an error if no name/phone/address exist', () => {
    const recipient = {} as Recipient
    const tree = render(<ReviewSummaryItemContact recipient={recipient} testID="ContactItem" />)
    expect(Logger.error).toHaveBeenCalledTimes(1)
    expect(tree.toJSON()).toBeNull()
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

describe('ReviewTotalValue', () => {
  const celoToken = mockTokenBalances[mockCeloTokenId] as unknown as TokenBalance
  const cUSDToken = mockTokenBalances[mockCusdTokenId] as unknown as TokenBalance
  it.each([
    {
      tokenInfo: { ...celoToken, priceUsd: new BigNumber(1) },
      tokenAmount: new BigNumber(10),
      localAmount: new BigNumber(10),
      feeTokenInfo: undefined,
      feeTokenAmount: undefined,
      feeLocalAmount: null,
      title:
        'returns the token and fiat amount when fee info is missing and local price is available',
      result:
        'tokenAndLocalAmountApprox, {"tokenAmount":"10.00","localAmount":"10.00","tokenSymbol":"CELO","localCurrencySymbol":"₱"}',
    },
    {
      tokenInfo: { ...celoToken, priceUsd: null },
      tokenAmount: new BigNumber(10),
      localAmount: null,
      feeTokenInfo: undefined,
      feeTokenAmount: undefined,
      feeLocalAmount: null,
      title:
        'returns only the token amount when fee info is missing and no local price is available',
      result: 'tokenAmountApprox, {"tokenAmount":"10.00","tokenSymbol":"CELO"}',
    },
    {
      tokenInfo: { ...celoToken, priceUsd: new BigNumber(1) },
      tokenAmount: new BigNumber(10),
      localAmount: new BigNumber(10),
      feeTokenInfo: { ...celoToken, priceUsd: new BigNumber(1) },
      feeTokenAmount: new BigNumber(0.5),
      feeLocalAmount: new BigNumber(0.5),
      title:
        'returns the token and local amount when the token and fee token are the same and local price is available',
      result:
        'tokenAndLocalAmountApprox, {"tokenAmount":"10.50","localAmount":"10.50","tokenSymbol":"CELO","localCurrencySymbol":"₱"}',
    },
    {
      tokenInfo: { ...celoToken, priceUsd: null },
      tokenAmount: new BigNumber(10),
      localAmount: null,
      feeTokenInfo: { ...celoToken, priceUsd: null },
      feeTokenAmount: new BigNumber(0.5),
      feeLocalAmount: null,
      title:
        "returns only the token amount when token and fee token are the same but they don't have local price",
      result: 'tokenAmountApprox, {"tokenAmount":"10.50","tokenSymbol":"CELO"}',
    },
    {
      tokenInfo: { ...cUSDToken, priceUsd: new BigNumber(1) },
      tokenAmount: new BigNumber(10),
      localAmount: new BigNumber(10),
      feeTokenInfo: { ...celoToken, priceUsd: new BigNumber(1) },
      feeTokenAmount: new BigNumber(0.5),
      feeLocalAmount: new BigNumber(0.5),
      title:
        'returns only the local amount when token and fee token are different but local prices are available for both',
      result: 'localAmountApprox, {"localAmount":"10.50","localCurrencySymbol":"₱"}',
    },
    {
      tokenInfo: { ...cUSDToken, priceUsd: null },
      tokenAmount: new BigNumber(10),
      localAmount: null,
      feeTokenInfo: { ...celoToken, priceUsd: null },
      feeTokenAmount: new BigNumber(0.5),
      feeLocalAmount: null,
      title:
        'returns multiple token amounts when token and fee token are different and no local prices available',
      result:
        'reviewTransaction.multipleTokensWithPlusSign, {"amount1":"10.00","symbol1":"cUSD","amount2":"0.50","symbol2":"CELO"}',
    },
  ])(
    '$title',
    ({
      tokenInfo,
      tokenAmount,
      localAmount,
      feeTokenInfo,
      feeTokenAmount,
      feeLocalAmount,
      result,
    }) => {
      const tree = render(
        <Provider store={createMockStore()}>
          <View testID="Total">
            <ReviewTotalValue
              tokenInfo={tokenInfo}
              feeTokenInfo={feeTokenInfo}
              tokenAmount={tokenAmount}
              localAmount={localAmount}
              feeTokenAmount={feeTokenAmount}
              feeLocalAmount={feeLocalAmount}
              localCurrencySymbol={LocalCurrencySymbol.PHP}
            />
          </View>
        </Provider>
      )
      expect(tree.getByTestId('Total')).toHaveTextContent(result)
    }
  )
})
