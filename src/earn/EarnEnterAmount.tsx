import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Colors } from 'react-native/Libraries/NewAppScreen'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import EarnAddCryptoBottomSheet from 'src/earn/EarnAddCryptoBottomSheet'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import EnterAmount, { ProceedComponentProps } from 'src/send/EnterAmount'
import { usePrepareSendTransactions } from 'src/send/usePrepareSendTransactions'
import { COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE } from 'src/send/utils'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import { walletAddressSelector } from 'src/web3/selectors'

type Props = NativeStackScreenProps<StackParamList, Screens.EarnEnterAmount>

const TAG = 'EarnEnterAmount'

function EarnEnterAmount({ route }: Props) {
  const { tokenId } = route.params
  const token = useTokenInfo(tokenId)
  if (!token) {
    // This should never happen
    Logger.error(TAG, 'Token not found')
    return null
  }

  const [tokenAmount, setTokenAmount] = useState(new BigNumber(0))
  const [preparedTransaction, setpreparedTransaction] = useState(undefined)

  const infoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const addCryptoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const reviewBottomSheetRef = useRef<BottomSheetRefType>(null)

  // TODO: Update this to have correct prepared transaction stuff
  const {
    prepareTransactionsResult,
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionError,
  } = usePrepareSendTransactions()

  const walletAddress = useSelector(walletAddressSelector)

  const handleRefreshPreparedTransactions = (
    amount: BigNumber,
    token: TokenBalance,
    feeCurrencies: TokenBalance[]
  ) => {
    if (!walletAddress) {
      Logger.error(TAG, 'Wallet address not set. Cannot refresh prepared transactions.')
      return
    }

    return refreshPreparedTransactions({
      amount,
      token,
      recipientAddress: recipient.address,
      walletAddress,
      feeCurrencies,
      comment: COMMENT_PLACEHOLDER_FOR_FEE_ESTIMATE,
    })
  }

  const onPressContinue = () => {
    tokenAmount?.gt(token.balance)
      ? addCryptoBottomSheetRef.current?.snapToIndex(0)
      : reviewBottomSheetRef.current?.snapToIndex(0)
  }

  const onPressInfo = () => {
    infoBottomSheetRef.current?.snapToIndex(0)
  }

  return (
    <EnterAmount
      tokens={[token]}
      defaultToken={token}
      prepareTransactionsResult={prepareTransactionsResult}
      onClearPreparedTransactions={clearPreparedTransactions}
      onRefreshPreparedTransactions={handleRefreshPreparedTransactions}
      prepareTransactionError={prepareTransactionError}
      tokenSelectionDisabled={true}
      onPressProceed={onPressContinue}
      onPressInfo={onPressInfo}
      onSetTokenAmount={(amount: BigNumber) => setTokenAmount(amount)}
      ProceedComponent={EarnProceed}
    >
      <InfoBottomSheet infoBottomSheetRef={infoBottomSheetRef} />
      <EarnAddCryptoBottomSheet
        forwardedRef={addCryptoBottomSheetRef}
        token={token}
        tokenAmount={tokenAmount}
      />
      <EarnDepositBottomSheet
        forwardedRef={reviewBottomSheetRef}
        preparedTransaction={preparedTransaction}
        amount={tokenAmount.toString()}
        tokenId={token.tokenId}
      />
    </EnterAmount>
  )
}

function EarnProceed({ token, disabled, onPressProceed, onPressInfo }: ProceedComponentProps) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const tvl = 150000000 // TODO: Replace with actual TVL
  const rate = 3.33 // TODO: Replace with actual rate

  return (
    <View style={styles.infoContainer}>
      <View style={styles.line}>
        <Text style={styles.label}>{t('earnFlow.enterAmount.tvlLabel')}</Text>
        <Text style={styles.label}>{t('earnFlow.enterAmount.rateLabel')}</Text>
      </View>
      <View style={styles.line}>
        <Text>
          {localCurrencySymbol}
          {tvl}
        </Text>
        <View style={styles.row}>
          <TokenIcon token={token} size={IconSize.SMALL} />
          <Text>{t('earnFlow.enterAmount.rate', { rate })}</Text>
        </View>
      </View>
      <Button
        onPress={() => onPressProceed}
        text={t('earnFlow.enterAmount.continue')}
        style={styles.continueButton}
        size={BtnSizes.FULL}
        disabled={disabled}
      />
      <View style={styles.row}>
        <Text style={styles.infoText}>{t('earnFlow.enterAmount.info')}</Text>
        <TouchableOpacity
          onPress={onPressInfo}
          hitSlop={variables.iconHitslop}
          testID="AssetsTokenBalance/Info"
        >
          <InfoIcon color={Colors.black} size={24} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

function InfoBottomSheet({
  infoBottomSheetRef,
}: {
  infoBottomSheetRef: React.RefObject<BottomSheetRefType>
}) {
  const { t } = useTranslation()
  const onPressDismiss = () => {
    infoBottomSheetRef.current?.close()
  }

  return (
    <BottomSheet
      forwardedRef={infoBottomSheetRef}
      title={t('earnFlow.enterAmount.infoBottomSheet.title')}
      description={t('earnFlow.enterAmount.infoBottomSheet.description')}
      testId={'Earn/EnterAmount/InfoBottomSheet'}
      titleStyle={styles.infoTitle}
    >
      <Button
        onPress={onPressDismiss}
        text={t('earnFlow.enterAmount.infoBottomSheet.dismiss')}
        size={BtnSizes.FULL}
        type={BtnTypes.GRAY_WITH_BORDER}
      />
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  infoContainer: {
    padding: Spacing.Regular16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray2,
  },
  line: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.Smallest8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  label: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  continueButton: {
    paddingVertical: Spacing.Thick24,
  },
  infoText: {
    ...typeScale.bodyXSmall,
    color: Colors.gray4,
  },
  infoTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
})

export default EarnEnterAmount
