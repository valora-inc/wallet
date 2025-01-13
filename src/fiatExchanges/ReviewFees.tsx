import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import Touchable from 'src/components/Touchable'
import InfoIcon from 'src/icons/InfoIcon'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { navigateToURI } from 'src/utils/linking'

interface Props {
  provider: string
  tokenIdToBuy: string
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
  tokenIdToBuy,
  feeWaived,
  feeUrl,
}: Props) {
  const [showFeeExplanation, setShowFeeExplanation] = useState(false)
  const [showFeeDiscountExplanation, setShowFeeDiscountExplanation] = useState(false)
  const { t } = useTranslation()

  const openFeeExplanation = () => setShowFeeExplanation(true)
  const closeFeeExplanation = () => setShowFeeExplanation(false)

  const openFeeDiscountExplanation = () => setShowFeeDiscountExplanation(true)
  const closeFeeDiscountExplanation = () => setShowFeeDiscountExplanation(false)

  const openProviderFeeUrl = () => navigateToURI(feeUrl)

  const tokenInfo = useTokenInfo(tokenIdToBuy)
  if (!tokenInfo) {
    throw new Error(`Token info not found for token ID ${tokenIdToBuy}`)
  }
  const tokenSymbol = tokenInfo.symbol

  const showAmount = (value: number, isCelo: boolean = false, textStyle: any[] = []) => (
    <CurrencyDisplay
      amount={{
        value: 0,
        localAmount: {
          value,
          currencyCode: isCelo ? tokenSymbol : localCurrency,
          exchangeRate: 1,
        },
        currencyCode: isCelo ? tokenSymbol : localCurrency,
      }}
      hideSymbol={false}
      showLocalAmount={true}
      showExplicitPositiveSign={false}
      style={[...textStyle]}
    />
  )

  return (
    <View style={[styles.review]}>
      <Dialog
        isVisible={showFeeExplanation}
        actionText={t('ok')}
        actionPress={closeFeeExplanation}
        isActionHighlighted={false}
        onBackgroundPress={closeFeeExplanation}
      >
        <Text style={typeScale.labelSemiBoldLarge}>{t('providerFeesDialog.title')}</Text>
        {'\n\n'}
        <Text style={[typeScale.bodyMedium]}>{t('providerFeesDialog.body1')}</Text>
        <Text style={{ color: colors.accent }} onPress={openProviderFeeUrl}>
          {t('providerFeesDialog.body2', { providerName: provider })}
        </Text>
      </Dialog>
      <Dialog
        isVisible={showFeeDiscountExplanation}
        actionText={t('ok')}
        actionPress={closeFeeDiscountExplanation}
        isActionHighlighted={false}
        onBackgroundPress={closeFeeDiscountExplanation}
      >
        <Text style={typeScale.labelSemiBoldLarge}>{t('providerFeeDiscountDialog.title')}</Text>
        {'\n\n'}
        <Text style={[typeScale.bodyMedium]}>{t('providerFeeDiscountDialog.body')}</Text>
      </Dialog>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>
          {t('amount')} ({tokenSymbol})
        </Text>
        <Text style={[styles.reviewLineText]}>{showAmount(crypto.amount, true)}</Text>
      </View>
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>
          {t('pricePer', { coin: tokenSymbol })}
        </Text>
        <Text style={[styles.reviewLineText, styles.reviewLineTextAlt]}>
          {showAmount(fiat.subTotal / crypto.amount, false, [styles.reviewLineTextAlt])}
        </Text>
      </View>
      <View style={[styles.line]} />
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText]}>{t('subtotal')}</Text>
        <Text style={[styles.reviewLineText]}>{showAmount(fiat.subTotal)}</Text>
      </View>
      {!feeWaived ? (
        <View style={[styles.reviewLine]}>
          <View style={[styles.reviewLineInfo]}>
            <Text style={[styles.reviewLineText]}>
              {provider} {t('fee')}
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
      ) : (
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
          <Text style={styles.feeWaivedText}>{t('free')}</Text>
        </View>
      )}
      <View style={[styles.reviewLine]}>
        <Text style={[styles.reviewLineText, styles.reviewLineTextTotal]}>{t('Total')}</Text>
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
    ...typeScale.bodyMedium,
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
    ...typeScale.bodyMedium,
  },
  feeWaivedText: {
    ...typeScale.bodyMedium,
    color: colors.accent,
  },
  reviewLineTextAlt: {
    color: colors.gray4,
  },
  reviewLineTextTotal: {
    ...typeScale.labelSemiBoldMedium,
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
