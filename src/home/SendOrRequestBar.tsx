import {
  CryptoType,
  FeeFrequency,
  FeeType,
  FiatAccountSchema,
  FiatAccountType,
  FiatType,
} from '@fiatconnect/fiatconnect-types'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { HomeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import FiatConnectQuote from 'src/fiatExchanges/quotes/FiatConnectQuote'
import { CICOFlow } from 'src/fiatExchanges/utils'
import QRCodeBorderlessIcon from 'src/icons/QRCodeBorderless'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import { canSendTokensSelector } from 'src/send/selectors'
import colors from 'src/styles/colors'
import variables from 'src/styles/variables'
import { tokensListSelector } from 'src/tokens/selectors'

export default function SendOrRequestBar() {
  const sendButtonsDisabled = !useSelector(canSendTokensSelector)
  const requestButtonDisabled = useSelector(tokensListSelector).length === 0

  const onPressSend = () => {
    ValoraAnalytics.track(HomeEvents.home_send)
    navigate(Screens.Send)
  }

  const onPressRequest = () => {
    ValoraAnalytics.track(HomeEvents.home_request)
    navigate(Screens.Send, { isOutgoingPaymentRequest: true })
  }

  const onPressQrCode = () => {
    ValoraAnalytics.track(HomeEvents.home_qr)
    navigate(Screens.FiatDetailsScreen, {
      flow: CICOFlow.CashOut,
      quote: new FiatConnectQuote({
        flow: CICOFlow.CashOut,
        quote: {
          provider: {
            id: 'provider-two',
            providerName: 'Provider Two',
            imageUrl:
              'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png',
            baseUrl: 'fakewebsite.valoraapp.com',
            websiteUrl: 'https://valoraapp.com',
            iconUrl:
              'https://storage.googleapis.com/celo-mobile-mainnet.appspot.com/images/valora-icon.png',
          },
          ok: true,
          quote: {
            fiatType: FiatType.USD,
            cryptoType: CryptoType.cUSD,
            fiatAmount: '100',
            cryptoAmount: '100',
            quoteId: 'mock_quote_in_id',
            guaranteedUntil: '2099-04-27T19:22:36.000Z',
          },
          kyc: {
            kycRequired: false,
            kycSchemas: [],
          },
          fiatAccount: {
            BankAccount: {
              fiatAccountSchemas: [
                {
                  fiatAccountSchema: FiatAccountSchema.AccountNumber,
                  allowedValues: {},
                },
              ],
              fee: '0.53',
              feeType: FeeType.PlatformFee,
              feeFrequency: FeeFrequency.OneTime,
              settlementTimeLowerBound: `300`, // Five minutes
              settlementTimeUpperBound: `7200`, // Two hours
            },
          },
        },
        fiatAccountType: FiatAccountType.BankAccount,
      }),
    })
  }

  const { t } = useTranslation()

  return (
    <View style={styles.container} testID="SendOrRequestBar">
      <Button
        style={styles.button}
        size={BtnSizes.MEDIUM}
        text={t('send')}
        onPress={onPressSend}
        disabled={sendButtonsDisabled}
        testID="SendOrRequestBar/SendButton"
      />
      <Button
        style={[styles.button, styles.requestButton]}
        size={BtnSizes.MEDIUM}
        text={t('request')}
        onPress={onPressRequest}
        disabled={requestButtonDisabled}
        testID="SendOrRequestBar/RequestButton"
      />
      <Touchable borderless={true} onPress={onPressQrCode} testID="SendOrRequestBar/QRCode">
        <QRCodeBorderlessIcon height={32} color={colors.greenUI} />
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: variables.contentPadding,
    paddingVertical: 12,
    borderTopColor: colors.gray2,
    borderTopWidth: 1,
  },
  button: {
    flex: 1,
    flexDirection: 'column',
  },
  requestButton: {
    marginHorizontal: 12,
  },
})
