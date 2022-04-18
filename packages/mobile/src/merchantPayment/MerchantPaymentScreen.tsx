import { AbortCodes } from '@celo/payments-types'
import { useNavigation } from '@react-navigation/native'
import { StackScreenProps } from '@react-navigation/stack'
import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError, showMessage } from 'src/alert/actions'
import ContactCircle from 'src/components/ContactCircle'
import ReviewFrame from 'src/components/ReviewFrame'
import TokenDisplay from 'src/components/TokenDisplay'
import { BASE_TAG } from 'src/merchantPayment/constants'
import FeeContainer from 'src/merchantPayment/FeeContainer'
import { PaymentStatus, useMerchantPayments } from 'src/merchantPayment/hooks'
import { navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { useTokenInfoBySymbol } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

type Props = StackScreenProps<StackParamList, Screens.MerchantPayment>

function MerchantPaymentScreen({ route }: Props) {
  const LOG_TAG = BASE_TAG + 'Screen'

  const { params: routeParams } = route
  const prevSubscription = useRef<(e: any) => void>()
  const { t } = useTranslation()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const tokenInfo = useTokenInfoBySymbol(Currency.Dollar)
  const tokenAddress = tokenInfo?.address

  const {
    abort,
    amount,
    businessInformation,
    loading,
    submit,
    paymentStatus,
    chargeError,
  } = useMerchantPayments(routeParams.apiBase, routeParams.referenceId)

  const abortSubscriptionHandler = useCallback(
    (e) => {
      if (loading) return

      switch (paymentStatus) {
        case PaymentStatus.Initial:
          void abort(AbortCodes.CUSTOMER_DECLINED)
          break

        case PaymentStatus.Errored:
          void abort(AbortCodes.GENERAL)
          break

        case PaymentStatus.Pending:
        case PaymentStatus.Done:
        default:
          break
      }
    },
    [loading, paymentStatus]
  )

  // Abort the charge on "back" action (hardware back button, swipe, or normal navigate back)
  useEffect(() => {
    if (prevSubscription.current) {
      navigation.removeListener('beforeRemove', prevSubscription.current)
    }

    const unsubscribe = navigation.addListener('beforeRemove', abortSubscriptionHandler)
    prevSubscription.current = abortSubscriptionHandler

    // Unsubscribe will be called on unmount
    return unsubscribe
  }, [navigation, abortSubscriptionHandler])

  useEffect(() => {
    if (chargeError) {
      dispatch(showError(t('merchantPaymentSetup')))
      navigateHome()
    }
  }, [chargeError])

  const submitPayment = useCallback(async () => {
    try {
      void (await submit())
      dispatch(showMessage(t('merchantPaymentSubmitSuccess')))
      navigateHome()
    } catch {
      dispatch(showError(t('merchantPaymentSubmitFail')))
      navigateHome()
    }
  }, [submit])

  const FooterComponent = useCallback((...props) => <FeeContainer amount={amount} {...props} />, [
    amount,
  ])

  if (!tokenAddress) {
    Logger.error(LOG_TAG, "Couldn't grab the cUSD address")
    return null
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.greenBrand} />
        </View>
      )}
      {!loading && (
        <ReviewFrame
          FooterComponent={FooterComponent}
          confirmButton={{
            action: submitPayment,
            text: t('send'),
            disabled: paymentStatus === PaymentStatus.Pending || !amount,
          }}
          isSending={paymentStatus === PaymentStatus.Pending}
        >
          <View style={styles.transferContainer}>
            <Text style={styles.description}>{t('merchantMoneyEscrow')}</Text>
            <View style={styles.headerContainer}>
              <ContactCircle
                recipient={{
                  name: businessInformation?.name,
                  thumbnailPath: businessInformation?.imageUrl,
                  address: businessInformation?.address?.city || 'Missing address', // TODO: what do we do here
                }}
              />
              <View style={styles.recipientInfoContainer}>
                <Text style={styles.headerText} testID="HeaderText">
                  {t('sending')}
                </Text>
                <Text style={styles.displayName}>{businessInformation?.name}</Text>
              </View>
            </View>
            <TokenDisplay
              style={styles.amount}
              amount={amount}
              tokenAddress={tokenAddress}
              showLocalAmount={true}
            />
            {!!businessInformation && (
              <View>
                <Text style={styles.address}>
                  {businessInformation.legalName}
                  {'\n'}
                  {businessInformation.address.line1}
                  {'\n'}
                  {businessInformation.address.line2}
                  {'\n'}
                  {businessInformation.address.city}, {businessInformation.address.state + ' '}
                  {businessInformation.address.postalCode}
                  {'\n'}
                  {/*businessInformation.address.country*/}
                  {/*'\n'*/}
                </Text>
              </View>
            )}
          </View>
        </ReviewFrame>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    paddingTop: '75%',
  },
  description: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingBottom: 24,
  },
  transferContainer: {
    alignItems: 'flex-start',
    paddingBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recipientInfoContainer: {
    paddingLeft: 8,
  },
  headerText: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  address: {
    ...fontStyles.regular,
    paddingRight: 4,
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
})

export default MerchantPaymentScreen
