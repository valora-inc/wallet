import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import Expandable from 'src/components/Expandable'
import { EncryptionFeeIcon, ExchangeFeeIcon, SecurityFeeIcon } from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import Touchable from 'src/components/Touchable'
import { CurrencyInfo } from 'src/send/SendConfirmationLegacy'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Currency } from 'src/utils/currencies'

interface Props {
  isEstimate?: boolean
  currency?: Currency
  isExchange?: boolean
  securityFee?: BigNumber
  exchangeFee?: BigNumber
  dekFee?: BigNumber
  showDekfee?: boolean
  feeLoading?: boolean
  feeHasError?: boolean
  totalFee?: BigNumber
  testID?: string
  currencyInfo?: CurrencyInfo
  showLocalAmount?: boolean
}

export default function FeeDrawer({
  isEstimate,
  currency,
  isExchange,
  securityFee,
  exchangeFee,
  showDekfee,
  dekFee,
  feeLoading,
  feeHasError,
  totalFee,
  testID,
  currencyInfo,
  showLocalAmount,
}: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }

  const title = isEstimate ? t('feeEstimate') : t('feeActual')

  const securityAmount = securityFee &&
    currency && {
      value: securityFee,
      currencyCode: currency,
    }

  const exchangeAmount = exchangeFee &&
    currency && {
      value: exchangeFee,
      currencyCode: currency,
    }

  const dekFeeAmount = dekFee &&
    currency && {
      value: dekFee,
      currencyCode: currency,
    }

  const totalFeeAmount = totalFee &&
    currency && {
      value: totalFee,
      currencyCode: currency,
    }

  return (
    // Uses View instead of Fragment to workaround a glitch with LayoutAnimation
    <View>
      <Touchable onPress={toggleExpanded} testID={testID}>
        <View style={styles.totalContainer}>
          <Expandable isExpandable={true} isExpanded={expanded}>
            <Text style={styles.title}>{title}</Text>
          </Expandable>
          <LineItemRow
            title={''}
            amount={
              totalFeeAmount && (
                <CurrencyDisplay
                  amount={totalFeeAmount}
                  formatType={FormatType.Fee}
                  currencyInfo={currencyInfo}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/totalFee`}
                />
              )
            }
            isLoading={feeLoading}
            hasError={feeHasError}
          />
        </View>
      </Touchable>
      {expanded && (
        <View>
          {isExchange && (
            <LineItemRow
              title={t('exchangeFee')}
              titleIcon={<ExchangeFeeIcon />}
              amount={
                exchangeAmount && (
                  <CurrencyDisplay
                    amount={exchangeAmount}
                    formatType={FormatType.Fee}
                    currencyInfo={currencyInfo}
                    showLocalAmount={showLocalAmount}
                    testID={`${testID}/exchangeFee`}
                  />
                )
              }
              textStyle={styles.dropDownText}
            />
          )}
          {showDekfee && dekFeeAmount && (
            <LineItemRow
              title={t('encryption.feeLabel')}
              titleIcon={<EncryptionFeeIcon />}
              amount={
                <CurrencyDisplay
                  amount={dekFeeAmount}
                  formatType={FormatType.Fee}
                  currencyInfo={currencyInfo}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/dekFee`}
                />
              }
              textStyle={styles.dropDownText}
            />
          )}

          <LineItemRow
            title={t('securityFee')}
            titleIcon={<SecurityFeeIcon />}
            amount={
              securityAmount && (
                <CurrencyDisplay
                  amount={securityAmount}
                  formatType={FormatType.Fee}
                  currencyInfo={currencyInfo}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/securityFee`}
                />
              )
            }
            isLoading={feeLoading}
            hasError={feeHasError}
            textStyle={styles.dropDownText}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {
    ...fontStyles.regular,
    color: colors.dark,
  },
  dropDownText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
})
