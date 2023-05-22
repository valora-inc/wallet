import { useFocusEffect } from '@react-navigation/native'
import BigNumber from 'bignumber.js'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { showError } from 'src/alert/actions'
import { HomeEvents } from 'src/analytics/Events'
import { SendOrigin } from 'src/analytics/types'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import ContactCircle from 'src/components/ContactCircle'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import RequestMessagingCard from 'src/components/RequestMessagingCard'
import { NotificationBannerCTATypes, NotificationBannerTypes } from 'src/home/NotificationBox'
import { fetchAddressesAndValidate } from 'src/identity/actions'
import { AddressValidationType, SecureSendDetails } from 'src/identity/reducer'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { declinePaymentRequest } from 'src/paymentRequest/actions'
import { PaymentRequest } from 'src/paymentRequest/types'
import { getRecipientFromAddress } from 'src/recipients/recipient'
import { recipientInfoSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import { stablecoinsSelector } from 'src/tokens/selectors'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'

interface Props {
  paymentRequest: PaymentRequest
}

export default function IncomingPaymentRequestListItem({ paymentRequest }: Props) {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [payButtonPressed, setPayButtonPressed] = useState(false)
  const [addressesFetched, setAddressesFetched] = useState(false)

  const stableTokens = useSelector(stablecoinsSelector)
  const recipientInfo = useSelector(recipientInfoSelector)
  const requester = getRecipientFromAddress(paymentRequest.requesterAddress, recipientInfo)

  const e164PhoneNumber = requester.e164PhoneNumber
  const requesterAddress = requester.address

  const secureSendDetails: SecureSendDetails | undefined = useSelector(
    (state: RootState) => state.identity.secureSendPhoneNumberMapping[e164PhoneNumber || '']
  )

  const onPayButtonPressed = () => {
    setPayButtonPressed(true)
    if (e164PhoneNumber) {
      // Need to check latest mapping to prevent user from accepting fraudulent requests
      dispatch(fetchAddressesAndValidate(e164PhoneNumber, requesterAddress))
    } else {
      navigateToNextScreen()
    }

    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.pay,
    })
  }

  const onDeclineButtonPressed = () => {
    ValoraAnalytics.track(HomeEvents.notification_select, {
      notificationType: NotificationBannerTypes.incoming_tx_request,
      selectedAction: NotificationBannerCTATypes.decline,
    })
    dispatch(declinePaymentRequest(paymentRequest.uid || ''))
    Logger.showMessage(t('requestDeclined'))
  }

  const navigateToNextScreen = () => {
    const cUsdTokenInfo = stableTokens.find((token) => token?.symbol === Currency.Dollar)
    const cEurTokenInfo = stableTokens.find((token) => token?.symbol === Currency.Euro)
    if (!cUsdTokenInfo?.address || !cEurTokenInfo?.address) {
      // Should never happen in producton
      throw new Error('No token address found for cUSD')
    }
    // If the user has enough cUSD balance, pay with cUSD
    // Else, try with cEUR
    // Else, throw up an error banner
    let transactionData: TransactionDataInput
    const usdRequested = new BigNumber(paymentRequest.amount)
    console.debug(
      'usdRequested',
      usdRequested.toString(),
      'cUsdTokenInfo.balance',
      cUsdTokenInfo.balance.toString(),
      'cEurTokenInfo.balance',
      cEurTokenInfo.balance.toString()
    )
    if (usdRequested.isLessThanOrEqualTo(cUsdTokenInfo.balance)) {
      transactionData = {
        comment: paymentRequest.comment,
        recipient: requester,
        inputAmount: new BigNumber(paymentRequest.amount),
        tokenAmount: new BigNumber(paymentRequest.amount),
        amountIsInLocalCurrency: false,
        tokenAddress: cUsdTokenInfo.address,
      }
    } else if (
      cEurTokenInfo.usdPrice &&
      usdRequested.isLessThanOrEqualTo(cEurTokenInfo.balance.multipliedBy(cEurTokenInfo.usdPrice))
    ) {
      transactionData = {
        comment: paymentRequest.comment,
        recipient: requester,
        inputAmount: new BigNumber(paymentRequest.amount).dividedBy(cEurTokenInfo.usdPrice),
        tokenAmount: new BigNumber(paymentRequest.amount).dividedBy(cEurTokenInfo.usdPrice),
        amountIsInLocalCurrency: false,
        tokenAddress: cEurTokenInfo.address,
      }
    } else {
      dispatch(showError(ErrorMessages.INSUFFICIENT_BALANCE_STABLE))
      return
    }

    const addressValidationType =
      secureSendDetails?.addressValidationType || AddressValidationType.NONE

    const origin = SendOrigin.AppRequestFlow
    if (addressValidationType === AddressValidationType.NONE) {
      navigate(Screens.SendConfirmation, { transactionData, origin, isFromScan: false })
    } else {
      navigate(Screens.ValidateRecipientIntro, {
        transactionData,
        addressValidationType,
        requesterAddress,
        origin,
      })
    }
  }

  useFocusEffect(
    useCallback(
      () => () => {
        // This is run when focus is lost.
        setPayButtonPressed(false)
        setAddressesFetched(false)
      },
      []
    )
  )

  useEffect(() => {
    // Need this to make sure it's only triggered on click
    if (!payButtonPressed) {
      return
    }

    const isFetchingAddresses = secureSendDetails?.isFetchingAddresses

    if (isFetchingAddresses) {
      setAddressesFetched(true)
    }

    if (addressesFetched && isFetchingAddresses === false) {
      setPayButtonPressed(false)
      if (secureSendDetails?.lastFetchSuccessful) {
        navigateToNextScreen()
      }
    }
  }, [payButtonPressed, secureSendDetails])

  return (
    <View style={styles.container}>
      <RequestMessagingCard
        testID={`IncomingPaymentRequestNotification/${paymentRequest.uid}`}
        title={t('incomingPaymentRequestNotificationTitle', { name: requester.name })}
        details={paymentRequest.comment}
        amount={
          <CurrencyDisplay
            amount={{
              value: paymentRequest.amount,
              currencyCode: Currency.Dollar,
            }}
          />
        }
        icon={<ContactCircle recipient={requester} />}
        callToActions={[
          {
            text: payButtonPressed ? (
              <ActivityIndicator testID={'loading/paymentRequest'} />
            ) : (
              t('send')
            ),
            onPress: onPayButtonPressed,
          },
          {
            text: t('decline'),
            onPress: onDeclineButtonPressed,
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
})
