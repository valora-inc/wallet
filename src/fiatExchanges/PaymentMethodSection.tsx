import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Expandable from 'src/components/Expandable'
import Touchable from 'src/components/Touchable'
import {
  CicoQuote,
  getFeeValueFromQuotes,
  PaymentMethod,
  ProviderQuote,
  SimplexQuote,
} from 'src/fiatExchanges/utils'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

export interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod
  cicoQuotes: CicoQuote[]
  setNoPaymentMethods: React.Dispatch<React.SetStateAction<boolean>>
  quoteOnPress: (cicoQuote: CicoQuote) => void
}

export function PaymentMethodSection({
  paymentMethod,
  cicoQuotes,
  setNoPaymentMethods,
  quoteOnPress,
}: PaymentMethodSectionProps) {
  const { t } = useTranslation()
  const sectionQuotes = cicoQuotes.filter(({ quote }) => quote.paymentMethod === paymentMethod)
  const localCurrency = useSelector(getLocalCurrencyCode)

  const isExpandable = sectionQuotes.length > 1
  const [expanded, setExpanded] = useState(false)

  const toggleExpanded = () => {
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }
  if (!sectionQuotes.length) {
    setNoPaymentMethods(true)
    return null
  }

  const renderExpandableSection = () => (
    <>
      <View style={styles.left}>
        <Text style={styles.category}>
          {paymentMethod === PaymentMethod.Card
            ? t('selectProviderScreen.card')
            : t('selectProviderScreen.bank')}
        </Text>
        {!expanded && (
          <Text style={styles.fee}>
            {
              // quotes assumed to be sorted ascending by fee
              renderFeeAmount(sectionQuotes[0].quote, t('selectProviderScreen.minFee'))
            }
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <Text style={styles.providerDropdown}>
          {t('selectProviderScreen.numProviders', { count: sectionQuotes.length })}
        </Text>
      </View>
    </>
  )

  const renderNonExpandableSection = () => (
    <>
      <View style={styles.left}>
        <Text style={styles.category}>
          {paymentMethod === PaymentMethod.Card
            ? t('selectProviderScreen.card')
            : t('selectProviderScreen.bank')}
        </Text>
        <Text style={styles.fee}>
          {renderFeeAmount(sectionQuotes[0].quote, t('selectProviderScreen.fee'))}
        </Text>
        <Text style={styles.topInfo}>{renderInfoText()}</Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          testID={`image-${sectionQuotes[0].provider.name}`}
          source={{ uri: sectionQuotes[0].provider.logoWide }}
          style={styles.providerImage}
          resizeMode="center"
        />
      </View>
    </>
  )

  const renderInfoText = () =>
    `${t('selectProviderScreen.idRequired')} | ${
      paymentMethod === PaymentMethod.Card
        ? t('selectProviderScreen.oneHour')
        : t('selectProviderScreen.numDays')
    }`
  const renderFeeAmount = (quote: SimplexQuote | ProviderQuote, postFix: string) => {
    const feeAmount = getFeeValueFromQuotes(quote)

    if (feeAmount === undefined) {
      return null
    }

    return (
      <Text>
        <CurrencyDisplay
          amount={{
            value: 0,
            localAmount: {
              value: feeAmount,
              currencyCode: localCurrency,
              exchangeRate: 1,
            },
            currencyCode: localCurrency,
          }}
          showLocalAmount={true}
          hideSign={true}
          style={styles.fee}
        />{' '}
        {postFix}
      </Text>
    )
  }
  return (
    <View style={styles.container}>
      <Touchable
        onPress={
          isExpandable
            ? toggleExpanded
            : ((quoteOnPress(sectionQuotes[0]) as unknown) as () => void)
        }
      >
        <View>
          <Expandable
            arrowColor={colors.greenUI}
            containerStyle={{
              ...styles.expandableContainer,
              paddingVertical: isExpandable ? (expanded ? 22 : 27) : 16,
            }}
            isExpandable={isExpandable}
            isExpanded={expanded}
          >
            {isExpandable ? renderExpandableSection() : renderNonExpandableSection()}
          </Expandable>
        </View>
      </Touchable>
      {expanded &&
        sectionQuotes.map((cicoQuote, index) => (
          <Touchable onPress={(quoteOnPress(cicoQuote) as unknown) as () => void}>
            <View style={styles.expandedContainer}>
              <View style={styles.left}>
                <Text style={styles.expandedFee}>
                  {renderFeeAmount(cicoQuote.quote, t('selectProviderScreen.fee'))}
                </Text>
                <Text style={styles.expandedInfo}>{renderInfoText()}</Text>
                {index === 0 && (
                  <Text style={styles.expandedTag}>{t('selectProviderScreen.bestRate')}</Text>
                )}
              </View>

              <View style={styles.imageContainer}>
                <Image
                  testID={`image-${cicoQuote.provider.name}`}
                  source={{ uri: cicoQuote.provider.logoWide }}
                  style={styles.providerImage}
                  resizeMode="center"
                />
              </View>
            </View>
          </Touchable>
        ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray2,
  },
  expandableContainer: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flex: 1,
  },
  right: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  expandedContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.gray2,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFA',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  providerImage: {
    flex: 1,
  },
  imageContainer: {
    width: 80,
    height: 40,
  },
  category: {
    ...fontStyles.small500,
  },
  fee: {
    ...fontStyles.regular500,
    marginTop: 4,
  },
  providerDropdown: {
    ...fontStyles.small500,
    color: colors.greenUI,
  },
  expandedInfo: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 2,
  },
  topInfo: {
    ...fontStyles.small,
    color: colors.gray4,
    marginTop: 4,
  },
  expandedFee: {
    ...fontStyles.regular500,
  },
  expandedTag: {
    ...fontStyles.label,
    color: colors.greenUI,
    fontSize: 12,
    marginTop: 2,
  },
})
