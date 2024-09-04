import BigNumber from 'bignumber.js'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import Expandable from 'src/components/Expandable'
import { ExchangeFeeIcon, SecurityFeeIcon } from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

interface Props {
  isEstimate?: boolean
  isExchange?: boolean
  securityFee?: BigNumber
  exchangeFee?: BigNumber
  feeLoading?: boolean
  feeHasError?: boolean
  totalFee?: BigNumber
  testID?: string
  showLocalAmount?: boolean
  tokenId?: string
}

export default function FeeDrawer({
  isEstimate,
  isExchange,
  securityFee,
  exchangeFee,
  feeLoading,
  feeHasError,
  totalFee,
  testID,
  showLocalAmount,
  tokenId,
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
              totalFee && (
                <TokenDisplay
                  amount={totalFee}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/totalFee`}
                  tokenId={tokenId}
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
                exchangeFee && (
                  <TokenDisplay
                    amount={exchangeFee}
                    showLocalAmount={showLocalAmount}
                    testID={`${testID}/exchangeFee`}
                    tokenId={tokenId}
                  />
                )
              }
              textStyle={styles.dropDownText}
            />
          )}
          <LineItemRow
            title={t('securityFee')}
            titleIcon={<SecurityFeeIcon />}
            amount={
              securityFee && (
                <TokenDisplay
                  amount={securityFee}
                  showLocalAmount={showLocalAmount}
                  testID={`${testID}/securityFee`}
                  tokenId={tokenId}
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
    ...typeScale.bodyMedium,
    color: colors.black,
  },
  dropDownText: {
    ...typeScale.bodyMedium,
    color: colors.gray4,
  },
})
