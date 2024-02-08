import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
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
import LegacyFeeDrawer from 'src/components/LegacyFeeDrawer'
import LineItemRow from 'src/components/LineItemRow'
import ReviewFrame from 'src/components/ReviewFrame'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import Touchable from 'src/components/Touchable'
import CustomHeader from 'src/components/header/CustomHeader'
import { FeeType, estimateFee } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import InfoIcon from 'src/icons/InfoIcon'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { getSecureSendAddress } from 'src/identity/secureSend'
import {
  addressToDataEncryptionKeySelector,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Recipient, RecipientType, getDisplayName } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { useInputAmounts } from 'src/send/SendAmount'
import { sendPayment } from 'src/send/actions'
import { isSendingSelector } from 'src/send/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import colors from 'src/styles/colors'
import fontStyles, { typeScale } from 'src/styles/fonts'
import { iconHitslop } from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { tokenSupportsComments } from 'src/tokens/utils'
import { Network } from 'src/transactions/types'
import networkConfig from 'src/web3/networkConfig'
import { isDekRegisteredSelector } from 'src/web3/selectors'
import { getNetworkFromNetworkId } from 'src/web3/utils'

type OwnProps = NativeStackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>
type Props = OwnProps

export const sendConfirmationScreenNavOptions = noHeader

export function useRecipientToSendTo(paramRecipient: Recipient) {
  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const e164NumberToAddress = useSelector(e164NumberToAddressSelector)
  return useMemo(() => {
    if (!paramRecipient.address && paramRecipient.e164PhoneNumber) {
      const recipientAddress = getAddressFromPhoneNumber(
        paramRecipient.e164PhoneNumber,
        e164NumberToAddress,
        secureSendPhoneNumberMapping,
        undefined
      )

      return {
        ...paramRecipient,
        // Setting the phone number explicitly so Typescript doesn't complain
        e164PhoneNumber: paramRecipient.e164PhoneNumber,
        address: recipientAddress ?? undefined,
        recipientType: RecipientType.PhoneNumber,
      }
    }
    return paramRecipient
  }, [paramRecipient])
}

function SendConfirmation(props: Props) {
  const { t } = useTranslation()

  const {
    origin,
    transactionData: {
      recipient: paramRecipient,
      tokenAmount: inputTokenAmount,
      amountIsInLocalCurrency,
      tokenAddress,
      comment: commentFromParams,
      tokenId,
    },
    feeAmount,
    feeTokenId,
    preparedTransaction,
  } = props.route.params

  const newSendScreen = getFeatureGate(StatsigFeatureGates.USE_NEW_SEND_FLOW)

  const [encryptionDialogVisible, setEncryptionDialogVisible] = useState(false)
  const [comment, setComment] = useState(commentFromParams ?? '')

  const tokenInfo = useTokenInfo(tokenId)
  const tokenNetwork = getNetworkFromNetworkId(tokenInfo?.networkId)
  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false
  const addressToDataEncryptionKey = useSelector(addressToDataEncryptionKeySelector)
  const isSending = useSelector(isSendingSelector)
  const fromModal = props.route.name === Screens.SendConfirmationModal
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const { localAmount, tokenAmount, usdAmount } = useInputAmounts(
    inputTokenAmount.toString(),
    false,
    tokenId,
    inputTokenAmount
  )

  const dispatch = useDispatch()

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const validatedRecipientAddress = getSecureSendAddress(
    paramRecipient,
    secureSendPhoneNumberMapping
  )
  const recipient = useRecipientToSendTo(paramRecipient)

  const feeEstimates = useSelector(feeEstimatesSelector)
  const feeType = FeeType.SEND
  const feeEstimate = tokenAddress ? feeEstimates[tokenAddress]?.[feeType] : undefined

  // for new send flow, preparedTransaction is expected to be present except for
  // payment requests (which may not include one if a tx is not possible, e.g.,
  // amount > balance, not enough for gas, etc).
  // for old send flow, feeEstimate must be present if network is celo
  // We could consider making the preparedTx a required field if we handle those
  // scenarios differently after the old send flow is cleaned up
  const isFeeAvailable = newSendScreen
    ? !!preparedTransaction
    : tokenNetwork !== Network.Celo || !!feeEstimate?.feeInfo
  const disableSend = isSending || !isFeeAvailable

  useEffect(() => {
    if (!newSendScreen && !feeEstimate && tokenAddress) {
      dispatch(estimateFee({ feeType, tokenAddress }))
    }
  }, [feeEstimate, newSendScreen])

  useEffect(() => {
    if (!newSendScreen && !isDekRegistered && tokenAddress) {
      dispatch(estimateFee({ feeType: FeeType.REGISTER_DEK, tokenAddress }))
    }
  }, [isDekRegistered, newSendScreen])

  // old flow fees
  const securityFeeInUsd = feeEstimate?.usdFee ? new BigNumber(feeEstimate.usdFee) : undefined
  const storedDekFee = tokenAddress ? feeEstimates[tokenAddress]?.[FeeType.REGISTER_DEK] : undefined
  const dekFeeInUsd = storedDekFee?.usdFee ? new BigNumber(storedDekFee.usdFee) : undefined

  // new flow fee
  const feeTokenInfo = useTokenInfo(feeTokenId)
  const feeInUsd =
    feeAmount && feeTokenInfo?.priceUsd
      ? new BigNumber(feeAmount).times(feeTokenInfo.priceUsd)
      : undefined

  const totalFeeInUsd = newSendScreen ? feeInUsd : securityFeeInUsd?.plus(dekFeeInUsd ?? 0)

  const FeeContainer = () => {
    return (
      <View style={styles.feeContainer}>
        {newSendScreen ? (
          feeAmount && (
            <LineItemRow
              testID="SendConfirmation/fee"
              title={t('feeEstimate')}
              amount={
                <TokenDisplay
                  amount={new BigNumber(feeAmount)}
                  tokenId={feeTokenId}
                  showLocalAmount={false}
                />
              }
            />
          )
        ) : (
          <LegacyFeeDrawer
            testID={'feeDrawer/SendConfirmation'}
            isEstimate={true}
            securityFeeTokenId={networkConfig.cusdTokenId}
            securityFee={securityFeeInUsd}
            showDekfee={!isDekRegistered}
            dekFee={dekFeeInUsd}
            feeLoading={feeEstimate?.loading || storedDekFee?.loading}
            feeHasError={feeEstimate?.error || storedDekFee?.error}
            totalFee={totalFeeInUsd}
            showLocalAmount={true}
          />
        )}
        <TokenTotalLineItem
          tokenAmount={tokenAmount}
          tokenId={tokenId}
          feeToAddInUsd={totalFeeInUsd}
          showLocalAmountForTotal={!newSendScreen}
          showApproxTotalBalance={newSendScreen}
          showApproxExchangeRate={newSendScreen}
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
    if (!isFeeAvailable) {
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
    })

    dispatch(
      sendPayment(
        tokenAmount,
        tokenId,
        usdAmount,
        comment,
        recipient,
        fromModal,
        feeEstimate?.feeInfo,
        preparedTransaction
      )
    )
  }

  const allowComment = tokenSupportsComments(tokenInfo)

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
            showLocalAmount={!newSendScreen && amountIsInLocalCurrency}
          />
          {newSendScreen && (
            <TokenDisplay
              testID="SendAmountFiat"
              style={styles.amountSubscript}
              amount={tokenAmount}
              tokenId={tokenInfo?.tokenId}
              showLocalAmount={true}
            />
          )}
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
