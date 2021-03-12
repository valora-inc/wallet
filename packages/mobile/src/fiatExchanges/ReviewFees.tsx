import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import { CurrencyCode } from 'src/config'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

interface Props {
  service: string
  currencyToBuy: CurrencyCode
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
  feesContent: string
}

export default function ReviewFees({
  service,
  crypto,
  fiat,
  localCurrency,
  currencyToBuy,
  feesContent,
}: Props) {
  const [showingTerms, setShowingTerms] = React.useState(false)

  const closeTerms = () => setShowingTerms(false)
  const openTerms = () => setShowingTerms(true)

  const showAmount = (value: number, isCelo: boolean = false, textStyle: any[] = []) => (
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
      style={[...textStyle]}
    />
  )

  return (
    <View style={[styles.review]}>
      <Dialog isVisible={showingTerms} actionText={'OK'} actionPress={closeTerms}>
        <Text style={[fontStyles.large600]}>{service} Fees (TBD)</Text>
        {'\n\n'}
        <Text style={[fontStyles.regular]}>{feesContent}</Text>
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
  dialog: {
    textAlign: 'center',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'green',
  },
  dialogContent: {
    backgroundColor: 'red',
    width: '100%',
    textAlign: 'center',
  },
  dialogTitle: {
    marginBottom: 12,
    display: 'flex',
    width: '100%',
  },
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
