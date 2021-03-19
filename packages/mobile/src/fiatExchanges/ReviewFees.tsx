import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import { CurrencyCode } from 'src/config'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'

interface Props {
  provider: string
  currencyToBuy: CurrencyCode
  localCurrency: LocalCurrencyCode
  crypto: {
    amount: number
  }
  fiat: {
    subTotal: number
    total: number
  }
  feeWaived: boolean
  feeUrl: string
}

export default function ReviewFees({
  provider,
  crypto,
  fiat,
  localCurrency,
  currencyToBuy,
  feeWaived,
  feeUrl,
}: Props) {
  const [showFeeExplanation, setShowFeeExplanation] = useState(false)
  const [showFeeDiscountExplanation, setShowFeeDiscountExplanation] = useState(false)
  const { t } = useTranslation(Namespaces.fiatExchangeFlow)

  const openFeeExplanation = () => setShowFeeExplanation(true)
  const closeFeeExplanation = () => setShowFeeExplanation(false)

  const openFeeDiscountExplanation = () => setShowFeeDiscountExplanation(true)
  const closeFeeDiscountExplanation = () => setShowFeeDiscountExplanation(false)

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
      hideSign={false}
      showExplicitPositiveSign={false}
      style={[...textStyle]}
    />
  )

  const token = currencyToBuy === CurrencyCode.CUSD ? 'cUSD' : 'CELO'

  return (
    <View style={[styles.review]}>
      <Dialog
        isVisible={showFeeExplanation}
        actionText={t('global:ok')}
        actionPress={closeFeeExplanation}
      >
        <Text style={[fontStyles.large600]}>{t('providerFeesDialog.title')}</Text>
        {'\n\n'}
        <Text style={[fontStyles.regular]}>{t('providerFeesDialog.body1')}</Text>
        <Text
          style={{ color: colors.greenUI }}
          onPress={() => {
            Linking.openURL(feeUrl)
          }}
        >
          {t('providerFeesDialog.body2', { providerName: provider })}
        </Text>
      </Dialog>
      <Dialog
        isVisible={showFeeDiscountExplanation}
        actionText={t('global:ok')}
        actionPress={closeFeeDiscountExplanation}
      >
        <Text style={[fontStyles.large600]}>{t('providerFeeDiscountDialog.title')}</Text>
        {'\n\n'}
        <Text style={[fontStyles.regular]}>{t('providerFeeDiscountDialog.body')}</Text>
      </Dialog>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>
          {t('global:amount')} ({token})
        </Text>
        <Text style={[styles.reviewLineText]}>{showAmount(crypto.amount, true)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>
          {t('pricePer', { coin: token })}
        </Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>
          {showAmount(fiat.subTotal / crypto.amount, false, [styles.reviewLineTextAlt])}
        </Text>
      </View>
      <View style={[styles.line]} />
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>{t('global:subtotal')}</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(fiat.subTotal)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <View style={[styles.reviewLineInfo]}>
          <Text style={[styles.reviewLineText]}>
            {provider} {t('exchangeFlow9:fee')}
          </Text>
          <Touchable
            style={[styles.icon]}
            onPress={openFeeExplanation}
            hitSlop={variables.iconHitslop}
          >
            <InfoIcon color={colors.gray3} size={14} />
          </Touchable>
        </View>
        <Text>{showAmount(fiat.total - fiat.subTotal, false, [styles.reviewLineText])}</Text>
      </View>
      {feeWaived && (
        <View style={[styles.reviewLine]}>
          <View style={[styles.reviewLineInfo]}>
            <Text style={[styles.reviewLineText]}>{t('feeDiscount')}</Text>
            <Touchable
              style={[styles.icon]}
              onPress={openFeeDiscountExplanation}
              hitSlop={variables.iconHitslop}
            >
              <InfoIcon color={colors.gray3} size={14} />
            </Touchable>
          </View>
          <Text>
            {showAmount((fiat.total - fiat.subTotal) * -1, false, [styles.feeWaivedText])}
          </Text>
        </View>
      )}
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>{t('global:Total')}</Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>
          {showAmount(feeWaived ? fiat.subTotal : fiat.total, false, [styles.reviewLineTextTotal])}
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
  },
  dialogContent: {
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
  feeWaivedText: {
    ...fontStyles.regular,
    color: colors.greenUI,
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
  emailLink: {
    color: colors.greenUI,
  },
})
