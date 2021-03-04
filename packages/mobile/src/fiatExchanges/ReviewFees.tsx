import React from 'react'
import { StyleSheet, View, Text } from 'react-native'
import fontStyles from '@celo/react-components/styles/fonts'
import colors from '@celo/react-components/styles/colors'
import { CURRENCY_ENUM } from 'src/geth/consts'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import Dialog from 'src/components/Dialog'
import Touchable from '@celo/react-components/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import variables from '@celo/react-components/styles/variables'

interface Props {
  service: string
  currencyToBuy: CURRENCY_ENUM
  localCurrency: LocalCurrencyCode
  crypto: {
    amount: number
    price: number
  }
  fiat: {
    amount: number
    fees: number
    total: number
  }
}

export default function ReviewFees({ service, crypto, fiat, localCurrency, currencyToBuy }: Props) {
  const [showingTerms, setShowingTerms] = React.useState(false)

  const closeTerms = () => setShowingTerms(false)
  const openTerms = () => setShowingTerms(true)

  const showAmount = (value: number, isCelo: boolean = false, styles: any[] = []) => (
    <CurrencyDisplay
      amount={{
        value: 0,
        localAmount: {
          value,
          currencyCode: isCelo ? currencyToBuy : localCurrency,
          exchangeRate: 1,
        },
        currencyCode: isCelo ? currencyToBuy : localCurrency,
      }}
      hideSymbol={false}
      showLocalAmount={true}
      hideSign={true}
      showExplicitPositiveSign={false}
      style={[...styles]}
    />
  )

  return (
    <View style={[styles.review]}>
      <Dialog isVisible={showingTerms} actionText={'OK'} actionPress={closeTerms}>
        <View>
          <Text style={[fontStyles.large600]}>{service} Fees (TBD)</Text>
        </View>
        <View>
          <Text style={[fontStyles.regular]}>Body</Text>
        </View>
      </Dialog>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>Amount ({currencyToBuy})</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(crypto.amount, true)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>{currencyToBuy} price</Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>
          {showAmount(crypto.price, false, [styles.reviewLineTextAlt])}
        </Text>
      </View>
      <View style={[styles.line]} />
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>Subtotal @ {crypto.price.toFixed(2)}</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(fiat.amount)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <View style={[styles.reviewLineInfo]}>
          <Text style={[styles.reviewLineText]}>{service} Fee</Text>
          <Touchable style={[styles.icon]} onPress={openTerms} hitSlop={variables.iconHitslop}>
            <InfoIcon color={colors.gray3} size={14} />
          </Touchable>
        </View>
        <Text style={[styles.reviewLineText]}>{showAmount(fiat.fees)}</Text>
      </View>
      <View style={[styles.line]} />
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>Total</Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>
          {showAmount(fiat.total, false, [styles.reviewLineTextTotal])}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  review: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  reviewLine: {
    ...fontStyles.regular,
    paddingVertical: 4,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLineInfo: {
    display: 'flex',
    flexDirection: 'row',
  },
  reviewLineText: {
    ...fontStyles.regular,
  },
  reviewLineTextAlt: {
    color: colors.gray4,
  },
  reviewLineTextTotal: {
    ...fontStyles.regular600,
  },
  line: {
    marginVertical: 16,
    height: 1,
    width: '100%',
    backgroundColor: colors.gray2,
  },
  icon: {
    position: 'relative',
    top: 5,
    marginLeft: 6,
  },
})
