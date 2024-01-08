import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import Expandable from 'src/components/Expandable'
import { EncryptionFeeIcon, SecurityFeeIcon } from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import { CurrencyInfo } from 'src/localCurrency/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  isEstimate?: boolean
  securityFeeTokenId?: string
  securityFee?: BigNumber
  dekFee?: BigNumber
  showDekfee?: boolean
  feeLoading?: boolean
  feeHasError?: boolean
  totalFee?: BigNumber
  testID?: string
  currencyInfo?: CurrencyInfo
  showLocalAmount?: boolean
}

/**
 * @deprecated use FeeDrawer instead
 */
export default function LegacyFeeDrawer({
  isEstimate,
  securityFeeTokenId,
  securityFee,
  showDekfee,
  dekFee,
  feeLoading,
  feeHasError,
  totalFee,
  testID,
  showLocalAmount,
}: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }

  const title = isEstimate ? t('feeEstimate') : t('feeActual')

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
              totalFee?.gt(0) && (
                <TokenDisplay
                  amount={totalFee}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/totalFee`}
                  tokenId={securityFeeTokenId}
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
          {showDekfee && dekFee?.gt(0) && (
            <LineItemRow
              title={t('encryption.feeLabel')}
              titleIcon={<EncryptionFeeIcon />}
              amount={
                <TokenDisplay
                  amount={dekFee}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/dekFee`}
                  tokenId={securityFeeTokenId}
                />
              }
              textStyle={styles.dropDownText}
            />
          )}

          <LineItemRow
            title={t('securityFee')}
            titleIcon={<SecurityFeeIcon />}
            amount={
              securityFee?.gt(0) && (
                <TokenDisplay
                  amount={securityFee}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/securityFee`}
                  tokenId={securityFeeTokenId}
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
    color: colors.black,
  },
  dropDownText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
})
