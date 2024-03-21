import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import walletJumpstart from 'src/abis/IWalletJumpstart'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import InLineNotification, { NotificationVariant } from 'src/components/InLineNotification'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import CustomHeader from 'src/components/header/CustomHeader'
import Checkmark from 'src/icons/Checkmark'
import Logo from 'src/icons/Logo'
import { jumpstartReclaimStatusSelector } from 'src/jumpstart/selectors'
import { jumpstartReclaimFlowStarted, jumpstartReclaimStarted } from 'src/jumpstart/slice'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import { TAG } from 'src/send/saga'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import { feeCurrenciesSelector } from 'src/tokens/selectors'
import TransactionDetails from 'src/transactions/feed/TransactionDetails'
import NetworkFeeRowItem from 'src/transactions/feed/detailContent/NetworkFeeRowItem'
import { NetworkId, TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { TransactionRequest, prepareTransactions } from 'src/viem/prepareTransactions'
import {
  SerializableTransactionRequest,
  getSerializablePreparedTransaction,
} from 'src/viem/preparedTransactionSerialization'
import EstimatedNetworkFee from 'src/walletConnect/screens/EstimatedNetworkFee'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, Hash, encodeFunctionData, parseEventLogs } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartTransactionDetailsScreen>

async function getClaimDataAndStatus(
  jumpstartContractAddress: Address,
  networkId: NetworkId,
  transactionHash: Hash
) {
  const viemClient = publicClient[networkIdToNetwork[networkId]]

  const transactionReceipt = await viemClient.getTransactionReceipt({
    hash: transactionHash,
  })

  const parsedLogs = parseEventLogs({
    abi: walletJumpstart.abi,
    eventName: ['ERC20Deposited'],
    logs: transactionReceipt.logs,
  })

  if (parsedLogs.length != 1) {
    throw new Error('Unexpected number of matching logs')
  }

  const { beneficiary, index } = parsedLogs[0].args

  Logger.debug('Decoded event', { beneficiary, index })

  const erc20Claim = await viemClient.readContract({
    address: jumpstartContractAddress as Address,
    abi: walletJumpstart.abi,
    functionName: 'erc20Claims',
    args: [beneficiary, index],
  })

  const claimed = erc20Claim[3]

  Logger.debug(`Reward deposited in ${transactionHash} ${claimed ? 'was' : 'was NOT'} claimed`)

  return { beneficiary, index: Number(index), claimed }
}

function JumpstartTransactionDetailsScreen({ route }: Props) {
  const { transaction } = route.params
  const { t } = useTranslation()
  const dispatch = useDispatch()

  const [reclaimTx, setReclaimTx] = useState<SerializableTransactionRequest | null>(null)
  const transactionString = useMemo(() => (reclaimTx ? JSON.stringify(reclaimTx) : ''), [reclaimTx])

  const transactionTokenInfo = useTokenInfo(transaction.amount.tokenId)
  const parsedAmount = new BigNumber(transaction.amount.value).abs()
  const token = useTokenInfo(transaction.amount.tokenId)
  const isDeposit = transaction.type === TokenTransactionTypeV2.Sent
  const jumpstartContractAddress = transaction.address
  const networkId = transaction.networkId
  const tokenAmount = transaction.amount

  const walletAddress = useSelector(walletAddressSelector)
  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const [error, setError] = React.useState<Error | null>(null)
  const feeCurrencies = useSelector((state) => feeCurrenciesSelector(state, networkId))

  const reclaimStatus = useSelector(jumpstartReclaimStatusSelector)
  const [isReclaimIniciated, setReclaimInitiated] = useState(false)

  useEffect(() => {
    if (!isReclaimIniciated) {
      return
    }
    Logger.debug('Change to status', reclaimStatus)
    switch (reclaimStatus) {
      case 'success':
        navigateHome()
        break
      case 'error':
        bottomSheetRef.current?.close()
        setError(new Error('Failed to reclaim'))
        break
    }
  }, [reclaimStatus, isReclaimIniciated])

  const title =
    transaction.type === TokenTransactionTypeV2.Sent
      ? t('feedItemJumpstartTitle')
      : t('feedItemJumpstartReceivedSubtitle')

  const fetchClaimData = useAsync(
    async () => {
      if (!isDeposit) {
        return
      }

      const { beneficiary, index, claimed } = await getClaimDataAndStatus(
        jumpstartContractAddress as Address,
        networkId,
        transaction.transactionHash as Hash
      )

      if (claimed) {
        return { claimed: true }
      }

      const reclaimTx: TransactionRequest = {
        from: walletAddress as Address,
        to: jumpstartContractAddress as Address,
        value: BigInt(0),
        data: encodeFunctionData({
          abi: walletJumpstart.abi,
          functionName: 'reclaimERC20',
          args: [beneficiary, BigInt(index)],
        }),
      }

      const preparedTransactions = await prepareTransactions({
        feeCurrencies,
        baseTransactions: [reclaimTx],
      })

      const resultType = preparedTransactions.type
      switch (resultType) {
        case 'need-decrease-spend-amount-for-gas': // fallthrough on purpose
        case 'not-enough-balance-for-gas':
          return {
            claimed: false,
            error: true,
          }
        case 'possible':
          return {
            preparedTransaction: preparedTransactions.transactions[0],
            claimed: false,
          }
      }
    },
    [],
    {
      onSuccess(result) {
        if (result) {
          if (result.preparedTransaction) {
            setReclaimTx(getSerializablePreparedTransaction(result.preparedTransaction))
          }
          if (result.error) {
            setError(new Error('Not enough balance for gas'))
          }
        }
      },
      onError: (error) => {
        setError(new Error('Failed to fetch escrow data'))
        Logger.error(TAG, 'Failed to fetch escrow data', error)
      },
    }
  )

  const resetState = () => {
    setReclaimTx(null)
    setError(null)
    fetchClaimData.execute()
  }

  const isClaimed = fetchClaimData.result?.claimed

  // const reclaimButton = (
  //   <View style={styles.buttonContainer}>
  //     <Button
  //       showLoading={fetchClaimData.loading || preparedTransactionAndOpenBottomSheet.loading}
  //       disabled={
  //         !fetchClaimData.result || preparedTransactionAndOpenBottomSheet.loading || !!error
  //       }
  //       onPress={() => preparedTransactionAndOpenBottomSheet.execute()}
  //       type={!isClaimed ? BtnTypes.PRIMARY : BtnTypes.LABEL_PRIMARY}
  //       text={!isClaimed ? t('reclaim') : t('claimed') + ' ✓'}
  //       fontStyle={typeScale.labelSemiBoldMedium}
  //       size={BtnSizes.FULL}
  //     />
  //   </View>
  // )

  const onReclaimPress = () => {
    dispatch(jumpstartReclaimFlowStarted())
    bottomSheetRef.current?.snapToIndex(0)
  }

  const onConfirm = () => {
    if (!reclaimTx) {
      Logger.warn(TAG, 'Reclaim transaction is not set')
      return
    }
    setReclaimInitiated(true)
    dispatch(jumpstartReclaimStarted({ reclaimTx, networkId, tokenAmount }))
  }

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  return (
    <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
      <CustomHeader style={{ paddingHorizontal: variables.contentPadding }} left={<BackButton />} />
      <TransactionDetails
        title={title}
        transaction={transaction}
        retryHandler={() => navigate(Screens.JumpstartEnterAmount)}
      >
        <View style={styles.amountContainer}>
          <View style={styles.amountTextContainer}>
            <View style={styles.amountRow}>
              <TokenDisplay
                style={styles.amount}
                amount={parsedAmount}
                tokenId={token.tokenId}
                showLocalAmount={false}
              />
              <TokenIcon token={token} size={IconSize.LARGE} />
            </View>

            <TokenDisplay
              style={styles.amountLocalCurrency}
              amount={parsedAmount}
              tokenId={token.tokenId}
              showLocalAmount
            />
          </View>
        </View>
        {isDeposit && (
          <View style={styles.buttonContainer}>
            <Button
              showLoading={fetchClaimData.loading}
              disabled={!fetchClaimData.result?.preparedTransaction || isClaimed}
              onPress={onReclaimPress}
              type={!isClaimed ? BtnTypes.PRIMARY : BtnTypes.LABEL_PRIMARY}
              text={!isClaimed ? t('reclaim') : t('claimed')}
              size={BtnSizes.FULL}
              icon={
                isClaimed ? <Checkmark height={Spacing.Thick24} color={Colors.successDark} /> : null
              }
              iconPositionLeft={false}
            />
          </View>
        )}
        <NetworkFeeRowItem fees={transaction.fees} transactionStatus={transaction.status} />
        <LineItemRow
          testID="JumpstartContent/TokenDetails"
          title={isDeposit ? t('amountSent') : t('amountReceived')}
          textStyle={typeScale.labelSemiBoldMedium}
          style={styles.amountSentContainer}
          amount={
            <TokenDisplay
              amount={parsedAmount}
              tokenId={transaction.amount.tokenId}
              showLocalAmount={false}
              hideSign={true}
              testID="JumpstartContent/AmountValue"
            />
          }
        />
        <LineItemRow
          title={
            <Trans
              i18nKey={'tokenExchangeRateApprox'}
              tOptions={{ symbol: transactionTokenInfo?.symbol }}
            >
              <TokenDisplay
                amount={new BigNumber(1)}
                tokenId={transaction.amount.tokenId}
                showLocalAmount={true}
                testID="JumpstartContent/transactionTokenExchangeRate"
              />
            </Trans>
          }
          amount={
            <TokenDisplay
              amount={parsedAmount}
              tokenId={transaction.amount.tokenId}
              showLocalAmount={true}
              hideSign={true}
              testID="JumpstartContent/AmountSentValueFiat"
            />
          }
          style={styles.tokenFiatValueContainer}
          textStyle={styles.tokenFiatValueText}
        />
        {error && (
          <InLineNotification
            style={styles.errorNotification}
            variant={NotificationVariant.Error}
            testID="JumpstartContent/ErrorNotification"
            withBorder={true}
            title={t('jumpstartReclaimError.title')}
            description={t('jumpstartReclaimError.description')}
            ctaLabel2={t('dismiss')}
            onPressCta2={resetState}
            ctaLabel={t('contactSupport')}
            onPressCta={() => {
              navigate(Screens.SupportContact)
            }}
          />
        )}
      </TransactionDetails>
      <BottomSheet forwardedRef={bottomSheetRef} testId="ReclaimBottomSheet">
        <Logo />
        <Text style={styles.header}>{t('confirmTransaction')}</Text>
        <Text style={styles.description}>{t('jumpstartReclaimDescription')}</Text>
        <DataFieldWithCopy
          label={t('walletConnectRequest.transactionDataLabel')}
          value={transactionString}
          copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
          testID="JumpstarReclaimBottomSheet/RequestPayload"
        />
        {reclaimTx && <EstimatedNetworkFee networkId={networkId} transaction={reclaimTx} />}
        <Button
          text={t('confirm')}
          showLoading={reclaimStatus === 'loading'}
          disabled={reclaimStatus !== 'idle'}
          onPress={onConfirm}
          size={BtnSizes.FULL}
        />
      </BottomSheet>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  amountSentContainer: {
    marginTop: Spacing.Small12,
  },
  tokenFiatValueContainer: {
    marginTop: -Spacing.Tiny4,
  },
  tokenFiatValueText: {
    ...typeScale.bodySmall,
    color: Colors.gray4,
  },
  amountContainer: {
    backgroundColor: Colors.gray1,
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 16,
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Large32,
    gap: Spacing.Regular16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.Regular16,
    marginTop: -Spacing.Small12,
  },
  amountTextContainer: {
    flex: 1,
  },
  amount: {
    ...typeScale.titleLarge,
    marginBottom: Spacing.Smallest8,
    flex: 1,
  },
  amountLocalCurrency: {
    ...typeScale.labelMedium,
  },
  buttonContainer: {
    marginBottom: Spacing.Thick24,
    width: '100%',
  },
  amountRow: {
    flexDirection: 'row',
  },
  header: {
    ...typeScale.titleSmall,
    color: Colors.black,
    paddingVertical: Spacing.Regular16,
  },
  description: {
    ...typeScale.bodySmall,
    color: Colors.black,
    marginBottom: Spacing.Thick24,
  },
  errorNotification: {
    marginVertical: Spacing.Regular16,
  },
})

export default JumpstartTransactionDetailsScreen
