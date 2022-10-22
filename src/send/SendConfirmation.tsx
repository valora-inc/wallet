import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CommentTextInput from 'src/components/CommentTextInput'
import ContactCircle from 'src/components/ContactCircle'
import Dialog from 'src/components/Dialog'
import FeeDrawer from 'src/components/FeeDrawer'
import HeaderWithBackButton from 'src/components/header/HeaderWithBackButton'
import ReviewFrame from 'src/components/ReviewFrame'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TextButton from 'src/components/TextButton'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import Touchable from 'src/components/Touchable'
import { estimateFee, FeeType } from 'src/fees/reducer'
import { feeEstimatesSelector } from 'src/fees/selectors'
import InfoIcon from 'src/icons/InfoIcon'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { getAddressValidationType, getSecureSendAddress } from 'src/identity/secureSend'
import {
  addressToDataEncryptionKeySelector,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import InviteAndSendModal from 'src/invite/InviteAndSendModal'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { noHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { modalScreenOptions } from 'src/navigator/Navigator'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { getDisplayName, Recipient } from 'src/recipients/recipient'
import useSelector from 'src/redux/useSelector'
import { sendPaymentOrInvite } from 'src/send/actions'
import { isSendingSelector } from 'src/send/selectors'
import { useInputAmounts } from 'src/send/SendAmount'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { iconHitslop } from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { isStablecoin } from 'src/tokens/utils'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import { isDekRegisteredSelector } from 'src/web3/selectors'

type OwnProps = StackScreenProps<
  StackParamList,
  Screens.SendConfirmation | Screens.SendConfirmationModal
>
type Props = OwnProps

export const sendConfirmationScreenNavOptions = (navOptions: Props) =>
  navOptions.route.name === Screens.SendConfirmationModal
    ? {
        ...noHeader,
        ...modalScreenOptions(navOptions),
      }
    : noHeader

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
      inputAmount,
      tokenAmount: inputTokenAmount,
      amountIsInLocalCurrency,
      tokenAddress,
      comment: commentFromParams,
    },
  } = props.route.params

  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [encryptionDialogVisible, setEncryptionDialogVisible] = useState(false)
  const [comment, setComment] = useState(commentFromParams ?? '')

  const tokenInfo = useTokenInfo(tokenAddress)
  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false
  const addressToDataEncryptionKey = useSelector(addressToDataEncryptionKeySelector)
  const isSending = useSelector(isSendingSelector)
  const fromModal = props.route.name === Screens.SendConfirmationModal
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const { localAmount, tokenAmount, usdAmount } = useInputAmounts(
    inputAmount.toString(),
    amountIsInLocalCurrency,
    tokenAddress,
    inputTokenAmount
  )

  const dispatch = useDispatch()

  const secureSendPhoneNumberMapping = useSelector(secureSendPhoneNumberMappingSelector)
  const addressValidationType = getAddressValidationType(
    paramRecipient,
    secureSendPhoneNumberMapping
  )
  const validatedRecipientAddress = getSecureSendAddress(
    paramRecipient,
    secureSendPhoneNumberMapping
  )
  const recipient = useRecipientToSendTo(paramRecipient)

  const onEditAddressClick = () => {
    ValoraAnalytics.track(SendEvents.send_secure_edit)
    navigate(Screens.ValidateRecipientIntro, {
      transactionData: props.route.params.transactionData,
      addressValidationType,
      origin: props.route.params.origin,
    })
  }

  const isInvite = !recipient.address
  const feeEstimates = useSelector(feeEstimatesSelector)
  const feeType = isInvite ? FeeType.INVITE : FeeType.SEND
  const feeEstimate = feeEstimates[tokenAddress]?.[feeType]

  useEffect(() => {
    dispatch(estimateFee({ feeType, tokenAddress }))
  }, [tokenAddress])

  useEffect(() => {
    if (!feeEstimate) {
      dispatch(estimateFee({ feeType, tokenAddress }))
    }
  }, [feeEstimate])

  useEffect(() => {
    if (!isDekRegistered) {
      dispatch(estimateFee({ feeType: FeeType.REGISTER_DEK, tokenAddress }))
    }
  }, [isDekRegistered])

  const securityFee = feeEstimate?.usdFee ? new BigNumber(feeEstimate.usdFee) : undefined
  const storedDekFee = feeEstimates[tokenAddress]?.[FeeType.REGISTER_DEK]
  const dekFee = storedDekFee?.usdFee ? new BigNumber(storedDekFee.usdFee) : undefined
  const totalFeeInUsd = securityFee?.plus(dekFee ?? 0)

  Logger.debug('FeeEstimate', JSON.stringify(feeEstimate))
  Logger.debug('FeeEstimates', JSON.stringify(feeEstimates))
  Logger.debug('SecurityFee.usdFee', JSON.stringify(securityFee))
  Logger.debug('StoredDekFee', JSON.stringify(storedDekFee))

  const FeeContainer = () => {
    return (
      <View style={styles.feeContainer}>
        <FeeDrawer
          testID={'feeDrawer/SendConfirmation'}
          isEstimate={true}
          currency={Currency.Dollar}
          securityFee={securityFee}
          showDekfee={!isDekRegistered}
          dekFee={dekFee}
          feeLoading={feeEstimate?.loading || storedDekFee?.loading}
          feeHasError={feeEstimate?.error || storedDekFee?.error}
          totalFee={totalFeeInUsd}
          showLocalAmount={true}
        />
        <TokenTotalLineItem
          tokenAmount={tokenAmount}
          tokenAddress={tokenAddress}
          feeToAddInUsd={totalFeeInUsd}
        />
      </View>
    )
  }

  const onShowEncryptionModal = () => setEncryptionDialogVisible(true)
  const onDismissEncryptionModal = () => setEncryptionDialogVisible(false)
  const onCloseInviteModal = () => setInviteModalVisible(false)

  const EncryptionWarningLabel = () => {
    const showLabel = !recipient.address || addressToDataEncryptionKey[recipient.address] === null

    return showLabel ? (
      <View style={styles.encryptionWarningLabelContainer}>
        <Text style={styles.encryptionWarningLabel}>{t('encryption.warningLabel')}</Text>
        <Touchable onPress={onShowEncryptionModal} borderless={true} hitSlop={iconHitslop}>
          <InfoIcon color={colors.informational} size={14} />
        </Touchable>
      </View>
    ) : null
  }

  const onBlur = () => {
    const trimmedComment = comment.trim()
    setComment(trimmedComment)
  }

  const onSendClick = () => {
    if (isInvite) {
      setInviteModalVisible(true)
    } else {
      sendOrInvite()
    }
  }

  const sendInvite = () => {
    setInviteModalVisible(false)
    sendOrInvite()
  }

  const sendOrInvite = () => {
    if (!feeEstimate?.feeInfo) {
      // This should never happen because the confirm button is disabled if this happens.
      dispatch(showError(ErrorMessages.SEND_PAYMENT_FAILED))
      return
    }
    ValoraAnalytics.track(SendEvents.send_confirm_send, {
      origin,
      recipientType: props.route.params.transactionData.recipient.recipientType,
      isScan: !!props.route.params?.isFromScan,
      isInvite,
      localCurrency: localCurrencyCode,
      usdAmount: usdAmount?.toString() ?? null,
      localCurrencyAmount: localAmount?.toString() ?? null,
      tokenAmount: tokenAmount.toString(),
      tokenSymbol: tokenInfo?.symbol ?? '',
      tokenAddress,
      commentLength: comment.length,
    })

    dispatch(
      sendPaymentOrInvite(
        tokenAmount,
        tokenAddress,
        usdAmount,
        comment,
        recipient,
        feeEstimate.feeInfo,
        fromModal,
        localAmount
      )
    )
  }

  const allowComment = !isInvite && isStablecoin(tokenInfo)

  return (
    <SafeAreaView
      style={styles.container}
      edges={props.route.name === Screens.SendConfirmationModal ? ['bottom'] : undefined}
    >
      <HeaderWithBackButton eventName={SendEvents.send_confirm_back} />
      <DisconnectBanner />
      <ReviewFrame
        FooterComponent={FeeContainer}
        LabelAboveKeyboard={EncryptionWarningLabel}
        confirmButton={{
          action: onSendClick,
          text: isInvite ? t('sendAndInvite') : t('send'),
          disabled: isSending || !feeEstimate?.feeInfo,
        }}
        isSending={isSending}
      >
        <View style={styles.transferContainer}>
          {isInvite && <Text style={styles.inviteText}>{t('inviteMoneyEscrow')}</Text>}
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
                <View style={styles.editContainer}>
                  <ShortenedAddress style={styles.address} address={validatedRecipientAddress} />
                  <TextButton
                    style={styles.editButton}
                    testID={'accountEditButton'}
                    onPress={onEditAddressClick}
                  >
                    {t('edit')}
                  </TextButton>
                </View>
              )}
            </View>
          </View>
          <TokenDisplay
            testID="SendAmount"
            style={styles.amount}
            amount={tokenAmount}
            tokenAddress={tokenAddress}
            showLocalAmount={amountIsInLocalCurrency}
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
        <InviteAndSendModal
          isVisible={inviteModalVisible}
          name={getDisplayName(recipient, t)}
          onInvite={sendInvite}
          onCancel={onCloseInviteModal}
        />
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
  inviteText: {
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
  editContainer: {
    flexDirection: 'row',
  },
  address: {
    ...fontStyles.small,
    color: colors.gray5,
    paddingRight: 4,
  },
  editButton: {
    ...fontStyles.small,
    color: colors.gray5,
    textDecorationLine: 'underline',
  },
  amount: {
    paddingVertical: 8,
    ...fontStyles.largeNumber,
  },
  encryptionWarningLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
  },
  encryptionWarningLabel: {
    ...fontStyles.regular,
    color: colors.informational,
    paddingRight: 8,
  },
})

export default SendConfirmation
