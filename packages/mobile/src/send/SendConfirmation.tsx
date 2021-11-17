import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import TextButton from '@celo/react-components/components/TextButton'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { iconHitslop } from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CommentTextInput from 'src/components/CommentTextInput'
import ContactCircle from 'src/components/ContactCircle'
import Dialog from 'src/components/Dialog'
import FeeDrawer from 'src/components/FeeDrawer'
import HeaderWithBackButton from 'src/components/header/HeaderWithBackButton'
import ShortenedAddress from 'src/components/ShortenedAddress'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenTotalLineItem from 'src/components/TokenTotalLineItem'
import { FeeType } from 'src/fees/actions'
import { useEstimateGasFee } from 'src/fees/hooks'
import { Namespaces } from 'src/i18n'
import InfoIcon from 'src/icons/InfoIcon'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { getAddressValidationType, getSecureSendAddress } from 'src/identity/secureSend'
import {
  addressToDataEncryptionKeySelector,
  e164NumberToAddressSelector,
  secureSendPhoneNumberMappingSelector,
} from 'src/identity/selectors'
import InviteAndSendModal from 'src/invite/InviteAndSendModal'
import { useCurrencyToLocalAmount } from 'src/localCurrency/hooks'
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
import { useTokenInfo } from 'src/tokens/hooks'
import { Currency } from 'src/utils/currencies'
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

function useRecipientToSendTo(paramRecipient: Recipient) {
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
  const { t } = useTranslation(Namespaces.sendFlow7)

  const {
    origin,
    transactionData: {
      recipient: paramRecipient,
      inputAmount,
      amountIsInLocalCurrency,
      tokenAddress,
    },
  } = props.route.params

  const [inviteModalVisible, setInviteModalVisible] = useState(false)
  const [encryptionDialogVisible, setEncryptionDialogVisible] = useState(false)
  const [comment, setComment] = useState('')

  const tokenInfo = useTokenInfo(tokenAddress)
  const isDekRegistered = useSelector(isDekRegisteredSelector) ?? false
  const addressToDataEncryptionKey = useSelector(addressToDataEncryptionKeySelector)
  const isSending = useSelector(isSendingSelector)
  const fromModal = props.route.name === Screens.SendConfirmationModal
  const localCurrencyCode = useSelector(getLocalCurrencyCode)
  const { localAmount, tokenAmount, usdAmount } = useInputAmounts(
    inputAmount.toString(),
    amountIsInLocalCurrency,
    tokenAddress
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
  const { loading: feeLoading, error: feeError, result: feeInfo } = useEstimateGasFee(
    isInvite ? FeeType.INVITE : FeeType.SEND,
    tokenAddress,
    recipient.address,
    tokenAmount,
    !isDekRegistered
  )
  const localToFeeExchangeRate = useCurrencyToLocalAmount(
    new BigNumber(1),
    feeInfo?.currency ?? Currency.Dollar
  )

  const FeeContainer = () => {
    let securityFee = feeInfo?.fee
    let dekFee
    if (!isDekRegistered && feeInfo?.fee) {
      // 'fee' contains cost for both DEK registration and
      // send payment so we adjust it here
      securityFee = feeInfo.fee.dividedBy(2)
      dekFee = feeInfo.fee.dividedBy(2)
    }

    const currencyInfo = {
      localCurrencyCode,
      localExchangeRate: localToFeeExchangeRate?.toString() ?? '',
    }

    return (
      <View style={styles.feeContainer}>
        <FeeDrawer
          testID={'feeDrawer/SendConfirmation'}
          isEstimate={true}
          currency={feeInfo?.currency}
          securityFee={securityFee}
          showDekfee={!isDekRegistered}
          dekFee={dekFee}
          feeLoading={feeLoading}
          feeHasError={!!feeError}
          totalFee={feeInfo?.fee}
          currencyInfo={currencyInfo}
          showLocalAmount={true}
        />
        <TokenTotalLineItem tokenAmount={tokenAmount} tokenAddress={tokenAddress} />
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
    ValoraAnalytics.track(SendEvents.send_confirm_send, {
      origin,
      isScan: !!props.route.params?.isFromScan,
      isInvite,
      localCurrency: localCurrencyCode,
      usdAmount: usdAmount.toString(),
      localCurrencyAmount: localAmount.toString(),
      tokenAmount: tokenAmount.toString(),
      tokenSymbol: tokenInfo?.symbol ?? '',
      tokenAddress,
      commentLength: comment.length,
    })

    dispatch(
      sendPaymentOrInvite(
        tokenAmount,
        tokenAddress,
        localAmount,
        usdAmount,
        comment,
        recipient,
        feeInfo,
        fromModal
      )
    )
  }

  const allowComment = !isInvite && tokenInfo?.isCoreToken

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
          text: isInvite ? t('inviteFlow11:sendAndInvite') : t('send'),
          disabled: isSending || !!feeError,
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
              <Text style={styles.displayName}>{getDisplayName(recipient, t)}</Text>
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
