import React, { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, LayoutAnimation, StyleSheet, Text, View } from 'react-native'
import { FiatExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Dialog from 'src/components/Dialog'
import Expandable from 'src/components/Expandable'
import Touchable from 'src/components/Touchable'
import { CryptoAmount, FiatAmount } from 'src/fiatExchanges/amount'
import NormalizedQuote from 'src/fiatExchanges/quotes/NormalizedQuote'
import { SettlementEstimation, SettlementTime } from 'src/fiatExchanges/quotes/constants'
import { getSettlementTimeString } from 'src/fiatExchanges/quotes/utils'
import { ProviderSelectionAnalyticsData } from 'src/fiatExchanges/types'
import { CICOFlow, PaymentMethod } from 'src/fiatExchanges/utils'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencyCode, usdToLocalCurrencyRateSelector } from 'src/localCurrency/selectors'
import { useDispatch, useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfo } from 'src/tokens/hooks'

const SETTLEMENT_TIME_STRINGS: Record<SettlementTime, string> = {
  [SettlementTime.LESS_THAN_ONE_HOUR]: 'selectProviderScreen.oneHour',
  [SettlementTime.LESS_THAN_X_HOURS]: 'selectProviderScreen.xHours',
  [SettlementTime.X_TO_Y_HOURS]: 'selectProviderScreen.xToYHours',
  [SettlementTime.LESS_THAN_X_DAYS]: 'selectProviderScreen.xDays',
  [SettlementTime.X_TO_Y_DAYS]: 'selectProviderScreen.xToYDays',
}

export type PaymentMethodSectionMethods =
  | PaymentMethod.Bank
  | PaymentMethod.Card
  | PaymentMethod.FiatConnectMobileMoney
  | PaymentMethod.Airtime

export interface PaymentMethodSectionProps {
  paymentMethod: PaymentMethodSectionMethods
  normalizedQuotes: NormalizedQuote[]
  flow: CICOFlow
  tokenId: string
  analyticsData: ProviderSelectionAnalyticsData
}

export function PaymentMethodSection({
  paymentMethod,
  normalizedQuotes,
  flow,
  tokenId,
  analyticsData,
}: PaymentMethodSectionProps) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const sectionQuotes = normalizedQuotes.filter(
    (quote) => quote.getPaymentMethod() === paymentMethod
  )
  const usdToLocalRate = useSelector(usdToLocalCurrencyRateSelector)
  const tokenInfo = useTokenInfo(tokenId)
  const localCurrency = useSelector(getLocalCurrencyCode)

  const isExpandable = sectionQuotes.length > 1
  const [expanded, setExpanded] = useState(isExpandable)
  const [newDialogVisible, setNewDialogVisible] = useState(false)

  useEffect(() => {
    if (sectionQuotes.length) {
      ValoraAnalytics.track(FiatExchangeEvents.cico_providers_section_impression, {
        flow,
        paymentMethod,
        quoteCount: sectionQuotes.length,
        providers: sectionQuotes.map((quote) => quote.getProviderId()),
      })
    }
  }, [])

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

  const getCategoryTitle = () => {
    switch (paymentMethod) {
      case PaymentMethod.Card:
        return t('selectProviderScreen.card')
      case PaymentMethod.FiatConnectMobileMoney:
        return t('selectProviderScreen.mobileMoney')
      case PaymentMethod.Bank:
        return t('selectProviderScreen.bank')
      case PaymentMethod.Airtime:
        return t('selectProviderScreen.airtime')
      default:
        // this should never happen
        throw new Error('invalid payment method')
    }
  }

  const renderExpandableSection = () => (
    <>
      <View testID={`${paymentMethod}/section`} style={styles.left}>
        <Text style={styles.category}>{getCategoryTitle()}</Text>
      </View>
      <View style={styles.right}>
        <Text testID={`${paymentMethod}/numProviders`} style={styles.providerDropdown}>
          {t('selectProviderScreen.numProviders', { count: sectionQuotes.length })}
        </Text>
      </View>
    </>
  )

  const renderProviderInfo = (quote: NormalizedQuote) => (
    <View testID={`${paymentMethod}/singleProviderInfo`} style={styles.providerInfoContainer}>
      <View style={styles.imageContainer}>
        <Image
          testID={`image-${quote.getProviderName()}`}
          source={{ uri: quote.getProviderLogo() }}
          style={styles.providerImage}
          resizeMode="center"
        />
      </View>
      {quote.isProviderNew() && (
        <Touchable
          testID={`newLabel-${quote.getProviderName()}`}
          style={styles.newLabelContainer}
          onPress={() => {
            ValoraAnalytics.track(FiatExchangeEvents.cico_providers_new_info_opened, {
              flow,
              provider: quote.getProviderId(),
              paymentMethod,
            })
            setNewDialogVisible(true)
          }}
        >
          <>
            <Text style={styles.newLabelText}>{t('selectProviderScreen.newLabel')}</Text>
            <InfoIcon size={16} color={colors.white} />
          </>
        </Touchable>
      )}
    </View>
  )

  // this is used only when there's a single quote, so it directly references sectionQuotes[0]
  const renderNonExpandableSection = () => (
    <>
      <View testID={`${paymentMethod}/singleProvider`} style={styles.left}>
        <Text style={styles.category}>{getCategoryTitle()}</Text>
        <Text testID={`${paymentMethod}/provider-0`} style={styles.fee}>
          {renderAmount(sectionQuotes[0])}
        </Text>
        <Text testID={`${paymentMethod}/provider-0/info`} style={styles.topInfo}>
          {renderInfoText(sectionQuotes[0])}
        </Text>
      </View>

      {renderProviderInfo(sectionQuotes[0])}
    </>
  )

  const getPaymentMethodSettlementTimeString = (settlementEstimation: SettlementEstimation) => {
    const { timeString, ...args } = getSettlementTimeString(
      settlementEstimation,
      SETTLEMENT_TIME_STRINGS
    )
    return timeString ? t(timeString, args) : t('selectProviderScreen.numDays')
  }

  const renderInfoText = (quote: NormalizedQuote) => {
    const mobileCarrier = quote.getMobileCarrier()
    const mobileCarrierRequirement = t('selectProviderScreen.mobileCarrierRequirement', {
      carrier: mobileCarrier,
    })
    const reqsSubtitleInfo = mobileCarrier ? mobileCarrierRequirement : quote.getKycInfo()
    const reqsSubtitleString = reqsSubtitleInfo ? `${reqsSubtitleInfo} | ` : ''
    return `${reqsSubtitleString}${getPaymentMethodSettlementTimeString(quote.getTimeEstimation())}`
  }

  const renderAmount = (normalizedQuote: NormalizedQuote) => {
    const defaultText = <Text>{t('selectProviderScreen.feesVary')}</Text>
    const receiveAmount = normalizedQuote.getReceiveAmount()

    if (receiveAmount) {
      return (
        <Text>
          <Trans i18nKey="selectProviderScreen.receiveAmount">
            {flow === CICOFlow.CashIn ? (
              <CryptoAmount amount={receiveAmount} tokenId={tokenId} />
            ) : (
              <FiatAmount amount={receiveAmount} currency={localCurrency} />
            )}
          </Trans>
        </Text>
      )
    } else {
      return defaultText
    }
  }

  return (
    <View style={styles.container}>
      <Touchable
        onPress={
          isExpandable
            ? toggleExpanded
            : sectionQuotes[0].onPress(
                flow,
                dispatch,
                analyticsData,
                tokenInfo && sectionQuotes[0].getFeeInCrypto(usdToLocalRate, tokenInfo)
              )
        }
      >
        <View>
          <Expandable
            arrowColor={colors.primary}
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
      {expanded && (
        <View testID={`${paymentMethod}/providerList`}>
          {sectionQuotes.map((normalizedQuote, index) => (
            <Touchable
              key={index}
              testID={`${paymentMethod}/provider-${index}`}
              onPress={normalizedQuote.onPress(
                flow,
                dispatch,
                analyticsData,
                tokenInfo && normalizedQuote.getFeeInCrypto(usdToLocalRate, tokenInfo)
              )}
            >
              <View style={styles.expandedContainer}>
                <View style={styles.left}>
                  <Text style={styles.expandedFee} testID={`${paymentMethod}/amount-${index}`}>
                    {renderAmount(normalizedQuote)}
                  </Text>
                  <Text style={styles.expandedInfo}>{renderInfoText(normalizedQuote)}</Text>
                  {index === 0 &&
                    !!tokenInfo &&
                    normalizedQuote.getFeeInCrypto(usdToLocalRate, tokenInfo) && (
                      <Text testID={`${paymentMethod}/bestRate`} style={styles.expandedTag}>
                        {t('selectProviderScreen.bestRate')}
                      </Text>
                    )}
                </View>

                {renderProviderInfo(normalizedQuote)}
              </View>
            </Touchable>
          ))}
        </View>
      )}
      <Dialog
        testID="newDialog"
        isVisible={newDialogVisible}
        title={t('selectProviderScreen.newDialog.title')}
        actionText={t('selectProviderScreen.newDialog.dismiss')}
        actionPress={() => {
          setNewDialogVisible(false)
        }}
        isActionHighlighted={false}
      >
        {t('selectProviderScreen.newDialog.body')}
      </Dialog>
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
    backgroundColor: '#F1FDF1',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  providerImage: {
    flex: 1,
  },
  providerInfoContainer: {
    flexDirection: 'column',
  },
  imageContainer: {
    height: 40,
    width: 40,
    marginLeft: 'auto',
  },
  newLabelContainer: {
    backgroundColor: colors.gray3,
    borderRadius: 100,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 4,
    marginLeft: 'auto',
    flexDirection: 'row',
    width: 'auto',
  },
  newLabelText: {
    ...fontStyles.label,
    color: colors.white,
    marginRight: 5,
  },
  category: {
    ...fontStyles.small,
  },
  fee: {
    ...fontStyles.small600,
    marginTop: 4,
  },
  providerDropdown: {
    ...fontStyles.small500,
    color: colors.gray3,
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
    ...fontStyles.small600,
  },
  expandedTag: {
    ...fontStyles.label,
    color: colors.primary,
    fontSize: 12,
    marginTop: 2,
  },
})
