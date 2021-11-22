import gql from 'graphql-tag'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { ExchangeItemFragment } from 'src/apollo/types'
import { transactionExchange } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { navigateToExchangeReview } from 'src/transactions/actions'
import TransactionFeedItem from 'src/transactions/TransactionFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import { Currency } from 'src/utils/currencies'
import { getLocalCurrencyDisplayValue, getMoneyDisplayValue } from 'src/utils/formatting'

type Props = ExchangeItemFragment & {
  status: TransactionStatus
}

export function ExchangeFeedItem(props: Props) {
  const { t } = useTranslation()
  const { type, amount, makerAmount, takerAmount, status, timestamp } = props

  const onPress = () => {
    navigateToExchangeReview(timestamp, {
      makerAmount,
      takerAmount,
    })
  }

  const boughtGold = takerAmount.currencyCode === Currency.Celo
  const icon = transactionExchange
  const goldAmount = boughtGold ? takerAmount : makerAmount

  return (
    <TransactionFeedItem
      type={type}
      amount={amount}
      title={t(boughtGold ? 'feedItemBoughtCeloTitle' : 'feedItemSoldCeloTitle')}
      info={t('feedItemExchangeCeloInfo', {
        amount: getMoneyDisplayValue(goldAmount.value, Currency.Celo),
        price: goldAmount.localAmount
          ? getLocalCurrencyDisplayValue(
              goldAmount.localAmount.exchangeRate,
              goldAmount.localAmount.currencyCode as LocalCurrencyCode,
              true
            )
          : '-',
      })}
      icon={<Image source={icon} style={styles.image} resizeMode="contain" />}
      timestamp={timestamp}
      status={status}
      onPress={onPress}
    />
  )
}

ExchangeFeedItem.fragments = {
  exchange: gql`
    fragment ExchangeItem on TokenExchange {
      __typename
      type
      hash
      amount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      timestamp
      takerAmount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      makerAmount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  `,
}

const styles = StyleSheet.create({
  image: {
    height: 40,
    width: 40,
  },
})

export default ExchangeFeedItem
