import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton'
import CommentTextInput from 'src/components/CommentTextInput'
import ContactCircle from 'src/components/ContactCircle'
import Dialog from 'src/components/Dialog'
import LineItemRow from 'src/components/LineItemRow'
import ReviewFrame from 'src/components/ReviewFrame'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import InfoIcon from 'src/icons/InfoIcon'
import { getSecureSendAddress } from 'src/identity/secureSend'
import {
  addressToDataEncryptionKeySelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { encryptComment, sendPayment } from 'src/send/actions'
import {
  encryptedCommentSelector,
  isEncryptingCommentSelector,
  isSendingSelector,
} from 'src/send/selectors'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { iconHitslop } from 'src/styles/variables'
import { useAmountAsUsd, useTokenInfo, useTokenToLocalAmount } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import { tokenSupportsComments } from 'src/tokens/utils'
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
    transactionData: { recipient, tokenAmount, tokenAddress, comment: commentFromParams, tokenId },
  } = props.route.params

  const { prepareTransactionsResult, refreshPreparedTransactions, clearPreparedTransactions } =
    usePrepareSendTransactions()

  const { maxFeeAmount, feeCurrency: feeTokenInfo } =
    getFeeCurrencyAndAmounts(prepareTransactionsResult)

  const [encryptionDialogVisible, setEncryptionDialogVisible] = useState(false)
  const [comment, setComment] = useState(commentFromParams ?? '')

  const tokenInfo = useTokenInfo(tokenId)
  const addressToDataEncryptionKey = useSelector(addressToDataEncryptionKeySelector)
  const isSending = useSelector(isSendingSelector)
  const fromModal = props.route.name === Screens.SendConfirmationModal
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const localAmount = useTokenToLocalAmount(tokenAmount, tokenId)
  const usdAmount = useAmountAsUsd(tokenAmount, tokenId)

  const walletAddress = useSelector(walletAddressSelector)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, tokenInfo!.networkId))
  const allowComment = tokenSupportsComments(tokenInfo)
  const encryptedComment = useSelector(encryptedCommentSelector)
  const isEncryptingComment = useSelector(isEncryptingCommentSelector)

  const dispatch = useDispatch()

  useEffect(() => {
    if (!walletAddress || !tokenInfo) {
      return // should never happen
    }
    clearPreparedTransactions()
    if (isEncryptingComment) {
      return // wait for comment to be encrypted before preparing a tx
    }
    const debouncedRefreshTransactions = setTimeout(() => {
      return refreshPreparedTransactions({
        amount: tokenAmount,
        token: tokenInfo,
        recipientAddress: recipient.address,
        walletAddress,
        feeCurrencies,
        comment: allowComment && comment ? encryptedComment ?? undefined : undefined,
      })
    }, DEBOUNCE_TIME_MS)
    return () => clearTimeout(debouncedRefreshTransactions)
  }, [
    encryptedComment,
    isEncryptingComment,
    comment,
    tokenInfo,
    tokenAmount,
    recipient,
    walletAddress,
    feeCurrencies,
  ])

  useEffect(() => {
    if (!walletAddress || !allowComment) {
      return
    }
    const debouncedEncryptComment = setTimeout(() => {
      dispatch(
        encryptComment({
          comment: comment.trim(),
          fromAddress: walletAddress,
          toAddress: recipient.address,
        })
      )
    }, DEBOUNCE_TIME_MS)
    return () => clearTimeout(debouncedEncryptComment)
  }, [comment])

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const validatedRecipientAddress = getSecureSendAddress(recipient, secureSendPhoneNumberMapping)
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

  const onShowEncryptionModal = () => setEncryptionDialogVisible(true)
  const onDismissEncryptionModal = () => setEncryptionDialogVisible(false)

  const EncryptionWarningLabel = () => {
    const showLabel = !recipient.address || addressToDataEncryptionKey[recipient.address] === null

    return showLabel ? (
      <View style={styles.encryptionWarningLabelContainer}>
        <Text style={styles.encryptionWarningLabel}>{t('encryption.warningLabel')}</Text>
        <Touchable onPress={onShowEncryptionModal} borderless={true} hitSlop={iconHitslop}>
          <InfoIcon color={colors.infoDark} size={14} />
        </Touchable>
      </View>
    ) : null
  }

  const onBlur = () => {
    const trimmedComment = comment.trim()
    setComment(trimmedComment)
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

    ValoraAnalytics.track(SendEvents.send_confirm_send, {
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
      commentLength: comment.length,
      isTokenManuallyImported: !!tokenInfo?.isManuallyImported,
    })

    dispatch(
      sendPayment(
        tokenAmount,
        tokenId,
        usdAmount,
        comment.trim(),
        recipient,
        fromModal,
        undefined,
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
        LabelAboveKeyboard={EncryptionWarningLabel}
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
              {validatedRecipientAddress && (
                <View style={styles.addressContainer}>
                  <ShortenedAddress style={styles.address} address={validatedRecipientAddress} />
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
          {allowComment && (
            <CommentTextInput
              testID={'send'}
              onCommentChange={setComment}
              comment={comment}
              onBlur={onBlur}
            />
          )}
        </View>
        {/** Encryption warning dialog */}
        <Dialog
          title={t('encryption.warningModalHeader')}
          isVisible={encryptionDialogVisible}
          actionText={t('dismiss')}
          actionPress={onDismissEncryptionModal}
          isActionHighlighted={false}
          onBackgroundPress={onDismissEncryptionModal}
        >
          {t('encryption.warningModalBody')}
        </Dialog>
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
    ...fontStyles.regular,
    color: colors.gray4,
  },
  displayName: {
    ...fontStyles.regular500,
  },
  addressContainer: {
    flexDirection: 'row',
  },
  address: {
    ...fontStyles.small,
    color: colors.gray5,
    paddingRight: 4,
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
  amountSubscript: {
    ...typeScale.bodyMedium,
    color: colors.gray5,
    paddingBottom: 16,
  },
  encryptionWarningLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  encryptionWarningLabel: {
    ...fontStyles.regular,
    color: colors.infoDark,
    paddingRight: 8,
  },
})

export default SendConfirmation
