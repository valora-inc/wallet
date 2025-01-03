import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import ContactCircle from 'src/components/ContactCircle'
import LineItemRow from 'src/components/LineItemRow'
import ReviewFrame from 'src/components/ReviewFrame'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import CustomHeader from 'src/components/header/CustomHeader'
import { e164NumberToAddressSelector } from 'src/identity/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName } from 'src/recipients/recipient'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { sendPayment } from 'src/send/actions'
import { isSendingSelector } from 'src/send/selectors'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { useAmountAsUsd, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { getFeeCurrencyAndAmounts } from 'src/viem/prepareTransactions'
import { getSerializablePreparedTransaction } from 'src/viem/preparedTransactionSerialization'
import { walletAddressSelector } from 'src/web3/selectors'

type OwnProps = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>
type Props = OwnProps

const DEBOUNCE_TIME_MS = 250

export const sendConfirmationScreenNavOptions = noHeader

function SendConfirmation(props: Props) {
  const { t } = useTranslation()

  const {
    origin,
    transactionData: { recipient, tokenAmount, tokenAddress, tokenId },
  } = props.route.params

  const { prepareTransactionsResult, refreshPreparedTransactions, clearPreparedTransactions } =
    usePrepareSendTransactions()

  const { maxFeeAmount, feeCurrency: feeTokenInfo } =
    getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const tokenInfo = useTokenInfo(tokenId)
  const isSending = useSelector(isSendingSelector)
  const fromModal = props.route.name === Screens.SendConfirmationModal
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenId)
  const usdAmount = useAmountAsUsd(tokenAmount, tokenId)

  const walletAddress = useSelector(walletAddressSelector)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, tokenInfo!.networkId))

  const dispatch = useDispatch()

  useEffect(() => {
    if (!walletAddress || !tokenInfo) {
      return // should never happen
    }
    clearPreparedTransactions()
    const debouncedRefreshTransactions = setTimeout(() => {
      return refreshPreparedTransactions({
        amount: tokenAmount,
        token: tokenInfo,
        recipientAddress: recipient.address,
        walletAddress,
        feeCurrencies,
      })
    }, DEBOUNCE_TIME_MS)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [tokenInfo, tokenAmount, recipient, walletAddress, feeCurrencies])

  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  const showAddress =
    !!recipient.e164PhoneNumber && (e164NumberToAddress[recipient.e164PhoneNumber]?.length ?? 0) > 1

  const disableSend =
    isSending || !prepareTransactionsResult || prepareTransactionsResult.type !== 'possible'

  const feeInUsd =
    maxFeeAmount && feeTokenInfo?.priceUsd ? maxFeeAmount.times(feeTokenInfo.priceUsd) : undefined

  const FeeContainer = () => {
    return (
      <View style={styles.feeContainer}>
        <LineItemRow
          testID="SendConfirmation/fee"
          title={t('feeEstimate')}
          textStyle={typeScale.bodyMedium}
          amount={
            maxFeeAmount && (
              <TokenDisplay
                amount={maxFeeAmount}
                tokenId={feeTokenInfo?.tokenId}
                showLocalAmount={false}
              />
            )
          }
          isLoading={!maxFeeAmount}
        />
        <LineItemRow
          testID="SendConfirmation/localFee"
          title=""
          style={styles.subHeading}
          textStyle={styles.subHeadingText}
          amount={
            maxFeeAmount && (
              <TokenDisplay
                amount={maxFeeAmount}
                tokenId={feeTokenInfo?.tokenId}
                showLocalAmount={true}
              />
            )
          }
        />
        <TokenTotalLineItem
          tokenAmount={tokenAmount}
          tokenId={tokenId}
          feeToAddInUsd={feeInUsd}
          showLocalAmountForTotal={false}
          showApproxTotalBalance={true}
          showApproxExchangeRate={true}
        />
      </View>
    )
  }

  const onSend = () => {
    const preparedTransaction =
      prepareTransactionsResult &&
      prepareTransactionsResult.type === 'possible' &&
      prepareTransactionsResult.transactions[0]
    if (!preparedTransaction) {
      // This should never happen because the confirm button is disabled if this happens.
      dispatch(showError(ErrorMessages.SEND_PAYMENT_FAILED))
      return
    }

    AppAnalytics.track(SendEvents.send_confirm_send, {
      origin,
      recipientType: recipient.recipientType,
      isScan: props.route.params.isFromScan,
      localCurrency: localCurrencyCode,
      usdAmount: usdAmount?.toString() ?? null,
      localCurrencyAmount: localAmount?.toString() ?? null,
      tokenAmount: tokenAmount.toString(),
      tokenSymbol: tokenInfo?.symbol ?? '',
      tokenAddress: tokenAddress ?? null,
      networkId: tokenInfo?.networkId ?? null,
      tokenId,
      isTokenManuallyImported: !!tokenInfo?.isManuallyImported,
    })

    dispatch(
      sendPayment(
        tokenAmount,
        tokenId,
        usdAmount,
        recipient,
        fromModal,
        getSerializablePreparedTransaction(preparedTransaction)
      )
    )
  }

  return (
    <SafeAreaView
      style={styles.container}
      // No modal display on android so we set edges to undefined
      edges={
        props.route.name === Screens.SendConfirmationModal && Platform.OS === 'ios'
          ? ['bottom']
          : undefined
      }
    >
      <CustomHeader
        style={{ paddingHorizontal: 8 }}
        left={<BackButton eventName={SendEvents.send_confirm_back} />}
      />
      <DisconnectBanner />
      <ReviewFrame
        FooterComponent={FeeContainer}
        confirmButton={{
          action: onSend,
          text: t('send'),
          disabled: disableSend,
        }}
        isSending={isSending}
      >
        <View style={styles.transferContainer}>
          <View style={styles.headerContainer}>
            <ContactCircle recipient={recipient} />
            <View style={styles.recipientInfoContainer}>
              <Text style={styles.headerText} testID="HeaderText">
                {t('sending')}
              </Text>
              <Text testID="DisplayName" style={styles.displayName}>
                {getDisplayName(recipient, t)}
              </Text>
              {showAddress && (
                <View style={styles.addressContainer} testID="RecipientAddress">
                  <ShortenedAddress style={styles.address} address={recipient.address} />
                </View>
              )}
            </View>
          </View>
          <TokenDisplay
            testID="SendAmount"
            style={styles.amount}
            amount={tokenAmount}
            tokenId={tokenId}
            showLocalAmount={false}
          />
          <TokenDisplay
            testID="SendAmountFiat"
            style={styles.amountSubscript}
            amount={tokenAmount}
            tokenId={tokenInfo?.tokenId}
            showLocalAmount={true}
          />
        </View>
      </ReviewFrame>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
  },
  feeContainer: {
    padding: 16,
    paddingBottom: 8,
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
    ...typeScale.labelMedium,
    color: colors.gray4,
  },
  displayName: {
    ...typeScale.labelMedium,
    color: colors.black,
  },
  addressContainer: {
    flexDirection: 'row',
  },
  address: {
    ...typeScale.labelSmall,
    color: colors.gray5,
    paddingRight: 4,
  },
  amount: {
    ...typeScale.titleLarge,
    paddingVertical: 8,
    color: colors.black,
  },
  amountSubscript: {
    ...typeScale.bodyMedium,
    color: colors.gray5,
    paddingBottom: 16,
  },
  subHeading: {
    marginVertical: 0,
  },
  subHeadingText: {
    ...typeScale.labelSmall,
    color: colors.gray4,
  },
})

export default SendConfirmation
