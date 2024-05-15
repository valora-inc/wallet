import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import EarnAddCryptoBottomSheet from 'src/earn/EarnAddCryptoBottomSheet'
import EarnDepositBottomSheet from 'src/earn/EarnDepositBottomSheet'
import { fetchAavePoolInfo } from 'src/earn/poolInfo'
import { usePrepareSupplyTransactions } from 'src/earn/prepareTransactions'
import InfoIcon from 'src/icons/InfoIcon'
import { getLocalCurrencySymbol } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useSelector } from 'src/redux/hooks'
import EnterAmount, { ProceedComponentProps } from 'src/send/EnterAmount'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenBalance } from 'src/tokens/slice'
import Logger from 'src/utils/Logger'
import networkConfig, { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, isAddress } from 'viem'

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

  const infoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const addCryptoBottomSheetRef = useRef<BottomSheetRefType>(null)
  const reviewBottomSheetRef = useRef<BottomSheetRefType>(null)

  const {
    prepareTransactionsResult,
    refreshPreparedTransactions,
    clearPreparedTransactions,
    prepareTransactionError,
  } = usePrepareSupplyTransactions()

  const walletAddress = useSelector(walletAddressSelector) as Address

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
      amount: amount.toString(),
      token,
      walletAddress,
      feeCurrencies,
      poolContractAddress: networkConfig.arbAavePoolV3ContractAddress,
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
      proceedComponentStatic={true}
    >
      <InfoBottomSheet infoBottomSheetRef={infoBottomSheetRef} />
      <EarnAddCryptoBottomSheet
        forwardedRef={addCryptoBottomSheetRef}
        token={token}
        tokenAmount={tokenAmount}
      />
      {prepareTransactionsResult && prepareTransactionsResult.type === 'possible' && (
        <EarnDepositBottomSheet
          forwardedRef={reviewBottomSheetRef}
          preparedTransaction={prepareTransactionsResult}
          amount={tokenAmount.toString()}
          tokenId={token.tokenId}
        />
      )}
    </EnterAmount>
  )
}

function EarnProceed({
  tokenAmount,
  localAmount,
  token,
  amountEnteredIn,
  disabled,
  onPressProceed,
  onPressInfo,
}: ProceedComponentProps) {
  const { t } = useTranslation()
  const localCurrencySymbol = useSelector(getLocalCurrencySymbol)

  const asyncPoolInfo = useAsync(
    async () => {
      if (!token || !token.address) {
        throw new Error(`Token with id ${token} not found`)
      }

      if (!isAddress(token.address)) {
        throw new Error(`Token with id ${token} does not contain a valid address`)
      }

      return fetchAavePoolInfo({
        assetAddress: token.address,
        contractAddress: networkConfig.arbAavePoolV3ContractAddress,
        network: networkIdToNetwork[token.networkId],
      })
    },
    [],
    {
      onError: (error) => {
        Logger.warn(TAG, error.message)
      },
    }
  )

  return (
    <View style={styles.infoContainer}>
      <View style={styles.line}>
        <Text style={styles.label}>{t('earnFlow.enterAmount.earnUpToLabel')}</Text>
        <Text style={styles.label}>{t('earnFlow.enterAmount.rateLabel')}</Text>
      </View>
      <View style={styles.line}>
        <Text style={styles.valuesText}>
          {t('earnFlow.enterAmount.earnUpTo', {
            fiatSymbol: localCurrencySymbol,
            amount:
              asyncPoolInfo?.result && !!asyncPoolInfo.result.apy && tokenAmount?.gt(0)
                ? tokenAmount.multipliedBy(new BigNumber(asyncPoolInfo.result.apy)).toFormat(2)
                : '--',
          })}
        </Text>
        <View style={styles.apy}>
          <TokenIcon token={token} size={IconSize.XSMALL} />
          <Text style={styles.valuesText}>
            {t('earnFlow.enterAmount.rate', {
              rate:
                asyncPoolInfo?.result && !!asyncPoolInfo.result.apy
                  ? (asyncPoolInfo.result.apy * 100).toFixed(2)
                  : '--',
            })}
          </Text>
        </View>
      </View>
      <Button
        onPress={() =>
          tokenAmount && onPressProceed({ tokenAmount, localAmount, token, amountEnteredIn })
        }
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
          <InfoIcon color={Colors.black} />
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
        style={{ marginTop: Spacing.Regular16 }}
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
    justifyContent: 'center',
    flex: 1,
    gap: Spacing.Tiny4,
  },
  apy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.Tiny4,
  },
  label: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  continueButton: {
    paddingVertical: Spacing.Thick24,
  },
  valuesText: {
    ...typeScale.labelSemiBoldSmall,
    marginVertical: Spacing.Tiny4,
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
