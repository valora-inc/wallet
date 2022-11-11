import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Expandable from 'src/components/Expandable'
import TokenDisplay from 'src/components/TokenDisplay'
import Touchable from 'src/components/Touchable'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import { localCurrencyExchangeRatesSelector } from 'src/localCurrency/selectors'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

export interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod
  normalizedQuotes: NormalizedQuote[]
  setNoPaymentMethods: React.Dispatch<React.SetStateAction<boolean>>
  flow: CICOFlow
}

export function PaymentMethodSection({
  paymentMethod,
  normalizedQuotes,
  setNoPaymentMethods,
  flow,
}: PaymentMethodSectionProps) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const sectionQuotes = normalizedQuotes.filter(
    (quote) => quote.getPaymentMethod() === paymentMethod
  )
  const exchangeRates = useSelector(localCurrencyExchangeRatesSelector)!

  const isExpandable = sectionQuotes.length > 1
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (sectionQuotes.length) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_section_impression, {
        flow,
        paymentMethod,
        quoteCount: sectionQuotes.length,
        providers: sectionQuotes.map((quote) => quote.getProviderId()),
      })
    } else {
      setNoPaymentMethods(true)
    }
  }, [sectionQuotes])

  const toggleExpanded = () => {
    if (expanded) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_section_collapse, {
        flow,
        paymentMethod,
      })
    } else {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_section_expand, {
        flow,
        paymentMethod,
      })
    }
    LayoutAnimation.easeInEaseOut()
    setExpanded(!expanded)
  }

  if (!sectionQuotes.length) {
    return null
  }

  const renderExpandableSection = () => (
    <>
      <View testID={`${paymentMethod}/section`} style={styles.left}>
        <Text style={styles.category}>
          {paymentMethod === PaymentMethod.Card
            ? t('selectProviderScreen.card')
            : t('selectProviderScreen.bank')}
        </Text>
        {!expanded && (
          <Text style={styles.fee}>
            {
              // quotes assumed to be sorted ascending by fee
              renderFeeAmount(sectionQuotes[0], t('selectProviderScreen.minFee'))
            }
          </Text>
        )}
      </View>

      <View style={styles.right}>
        <Text testID={`${paymentMethod}/numProviders`} style={styles.providerDropdown}>
          {t('selectProviderScreen.numProviders', { count: sectionQuotes.length })}
        </Text>
      </View>
    </>
  )

  const renderNonExpandableSection = (quote: NormalizedQuote) => (
    <>
      <View testID={`${paymentMethod}/singleProvider`} style={styles.left}>
        <Text style={styles.category}>
          {paymentMethod === PaymentMethod.Card
            ? t('selectProviderScreen.card')
            : t('selectProviderScreen.bank')}
        </Text>
        <Text testID={`${paymentMethod}/provider-0`} style={styles.fee}>
          {renderFeeAmount(sectionQuotes[0], t('selectProviderScreen.fee'))}
        </Text>
        <Text testID={`${paymentMethod}/provider-0/info`} style={styles.topInfo}>
          {renderInfoText(quote)}
        </Text>
      </View>

      <View style={styles.imageContainer}>
        <Image
          testID={`image-${sectionQuotes[0].getProviderName()}`}
          source={{ uri: sectionQuotes[0].getProviderLogo() }}
          style={styles.providerImage}
          resizeMode="center"
        />
      </View>
    </>
  )

  const renderInfoText = (quote: NormalizedQuote) => {
    const kycInfo = quote.getKycInfo()
    const kycString = kycInfo ? `${kycInfo} | ` : ''
    return `${kycString}${
      paymentMethod === PaymentMethod.Card
        ? t('selectProviderScreen.oneHour')
        : t('selectProviderScreen.numDays')
    }`
  }

  const renderFeeAmount = (normalizedQuote: NormalizedQuote, postFix: string) => {
    const feeAmount = normalizedQuote.getFeeInCrypto(exchangeRates)

    return (
      <>
        {feeAmount ? (
          <Text>
            <TokenDisplay
              amount={feeAmount}
              currency={normalizedQuote.getCryptoType()}
              showLocalAmount={flow === CICOFlow.CashIn}
              hideSign={false}
            />{' '}
            {postFix}
          </Text>
        ) : (
          <Text>{t('selectProviderScreen.feesVary')}</Text>
        )}
      </>
    )
  }
  return (
    <View style={styles.container}>
      <Touchable onPress={isExpandable ? toggleExpanded : sectionQuotes[0].onPress(flow, dispatch)}>
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
            {isExpandable
              ? renderExpandableSection()
              : renderNonExpandableSection(sectionQuotes[0])}
          </Expandable>
        </View>
      </Touchable>
      {expanded &&
        sectionQuotes.map((normalizedQuote, index) => (
          <Touchable
            key={index}
            testID={`${paymentMethod}/provider-${index}`}
            onPress={normalizedQuote.onPress(flow, dispatch)}
          >
            <View style={styles.expandedContainer}>
              <View style={styles.left}>
                <Text style={styles.expandedFee} testID={`${paymentMethod}/fee-${index}`}>
                  {renderFeeAmount(normalizedQuote, t('selectProviderScreen.fee'))}
                </Text>
                <Text style={styles.expandedInfo}>{renderInfoText(normalizedQuote)}</Text>
                {index === 0 && normalizedQuote.getFeeInCrypto(exchangeRates) && (
                  <Text testID={`${paymentMethod}/bestRate`} style={styles.expandedTag}>
                    {t('selectProviderScreen.bestRate')}
                  </Text>
                )}
              </View>

              <View style={styles.imageContainer}>
                <Image
                  testID={`image-${normalizedQuote.getProviderName()}`}
                  source={{ uri: normalizedQuote.getProviderLogo() }}
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
