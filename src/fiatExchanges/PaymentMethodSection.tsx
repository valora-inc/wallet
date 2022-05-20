import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Expandable from 'src/components/Expandable'
import Touchable from 'src/components/Touchable'
import {
  CICOFlow,
  CicoQuote,
  getFeeValueFromQuotes,
  isSimplexQuote,
  PaymentMethod,
  ProviderQuote,
  SimplexQuote,
} from 'src/fiatExchanges/utils'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { userLocationDataSelector } from 'src/networkInfo/selectors'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'

export interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethod
  cicoQuotes: CicoQuote[]
  setNoPaymentMethods: React.Dispatch<React.SetStateAction<boolean>>
  flow: CICOFlow
}

export function PaymentMethodSection({
  paymentMethod,
  cicoQuotes,
  setNoPaymentMethods,
  flow,
}: PaymentMethodSectionProps) {
  const { t } = useTranslation()
  const sectionQuotes = cicoQuotes.filter(({ quote }) => quote.paymentMethod === paymentMethod)
  const localCurrency = useSelector(getLocalCurrencyCode)
  const userLocation = useSelector(userLocationDataSelector)

  const isExpandable = sectionQuotes.length > 1
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (sectionQuotes.length) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_section_impression, {
        flow,
        paymentMethod,
        quoteCount: sectionQuotes.length,
        providers: sectionQuotes.map(({ provider }) => provider.name),
      })
    }
  }, [])

  const quoteOnPress = ({ quote, provider }: CicoQuote) => () => {
    ValoraAnalytics.track(FiatExchangeEvents.cico_providers_quote_selected, {
      flow,
      paymentMethod,
      provider: provider.name,
    })

    if (quote && userLocation?.ipAddress && isSimplexQuote(quote)) {
      navigate(Screens.Simplex, {
        simplexQuote: quote,
        userIpAddress: userLocation.ipAddress,
      })
      return
    }

    ;(quote as ProviderQuote).url && navigateToURI((quote as ProviderQuote).url)
  }

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
    setNoPaymentMethods(true)
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
              renderFeeAmount(sectionQuotes[0].quote, t('selectProviderScreen.minFee'))
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

  const renderNonExpandableSection = () => (
    <>
      <View testID={`${paymentMethod}/singleProvider`} style={styles.left}>
        <Text style={styles.category}>
          {paymentMethod === PaymentMethod.Card
            ? t('selectProviderScreen.card')
            : t('selectProviderScreen.bank')}
        </Text>
        <Text testID={`${paymentMethod}/provider-0`} style={styles.fee}>
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
          <Touchable
            key={index}
            testID={`${paymentMethod}/provider-${index}`}
            onPress={(quoteOnPress(cicoQuote) as unknown) as () => void}
          >
            <View style={styles.expandedContainer}>
              <View style={styles.left}>
                <Text style={styles.expandedFee}>
                  {renderFeeAmount(cicoQuote.quote, t('selectProviderScreen.fee'))}
                </Text>
                <Text style={styles.expandedInfo}>{renderInfoText()}</Text>
                {index === 0 && (
                  <Text testID={`${paymentMethod}/bestRate`} style={styles.expandedTag}>
                    {t('selectProviderScreen.bestRate')}
                  </Text>
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
