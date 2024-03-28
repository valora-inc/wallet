import { NativeStackScreenProps } from '@react-navigation/native-stack'
import BigNumber from 'bignumber.js'
import React, { useRef } from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import walletJumpstart from 'src/abis/IWalletJumpstart'
import BackButton from 'src/components/BackButton'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import CustomHeader from 'src/components/header/CustomHeader'
import Checkmark from 'src/icons/Checkmark'
import Logo from 'src/icons/Logo'
import { fetchClaimStatus } from 'src/jumpstart/fetchClaimStatus'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { TAG } from 'src/send/saga'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Shadow, Spacing, getShadowStyle } from 'src/styles/styles'
import variables from 'src/styles/variables'
import { useTokenInfo } from 'src/tokens/hooks'
import TransactionDetails from 'src/transactions/feed/TransactionDetails'
import NetworkFeeRowItem from 'src/transactions/feed/detailContent/NetworkFeeRowItem'
import { TokenTransactionTypeV2 } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import EstimatedNetworkFee from 'src/walletConnect/screens/EstimatedNetworkFee'
import { walletAddressSelector } from 'src/web3/selectors'
import { Address, Hash, encodeFunctionData } from 'viem'

type Props = NativeStackScreenProps<StackParamList, Screens.JumpstartTransactionDetailsScreen>

function JumpstartTransactionDetailsScreen({ route }: Props) {
  const { transaction } = route.params
  const { t } = useTranslation()

  const transactionTokenInfo = useTokenInfo(transaction.amount.tokenId)
  const parsedAmount = new BigNumber(transaction.amount.value).abs()
  const token = useTokenInfo(transaction.amount.tokenId)
  const isDeposit = transaction.type === TokenTransactionTypeV2.Sent
  const jumpstartContractAddress = transaction.address

  const walletAddress = useSelector(walletAddressSelector)
  const bottomSheetRef = useRef<BottomSheetRefType>(null)

  const title =
    transaction.type === TokenTransactionTypeV2.Sent
      ? t('feedItemJumpstartTitle')
      : t('feedItemJumpstartReceivedSubtitle')

  const fetchClaimData = useAsync(
    async () => {
      if (!isDeposit) {
        return
      }
      const { claimed, beneficiary, index } = await fetchClaimStatus(
        jumpstartContractAddress as Address,
        transaction.networkId,
        transaction.transactionHash as Hash
      )

      if (claimed) {
        return { claimed: true }
      }

      return {
        claimed: false,
        // TODO: use prepareTransactions
        preparedTransaction: {
          from: walletAddress as Address,
          to: jumpstartContractAddress as Address,
          value: '0',
          data: encodeFunctionData({
            abi: walletJumpstart.abi,
            functionName: 'reclaimERC20',
            args: [beneficiary, BigInt(index)],
          }),
          // TODO: Estimate
          gas: '130000',
          maxFeePerGas: '1000000000',
        },
      }
    },
    [],
    {
      onError: (error) => {
        // TODO: Show error message in the UI
        Logger.error(TAG, 'Failed to fetch escrow data', error)
      },
    }
  )

  const onReclaimPress = () => {
    bottomSheetRef.current?.snapToIndex(0)
  }

  const reclaimTx = fetchClaimData.result?.preparedTransaction
  const isClaimed = fetchClaimData.result?.claimed

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
              testID={'JumpstartContent/ReclaimButton'}
              showLoading={fetchClaimData.loading}
              disabled={!fetchClaimData.result || isClaimed}
              onPress={onReclaimPress}
              type={BtnTypes.PRIMARY}
              text={!isClaimed ? t('reclaim') : t('claimed')}
              size={BtnSizes.FULL}
              icon={isClaimed ? <Checkmark height={Spacing.Thick24} color={Colors.white} /> : null}
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
      </TransactionDetails>
      <BottomSheet forwardedRef={bottomSheetRef} testId="ReclaimBottomSheet">
        <View style={styles.logoShadow}>
          <View style={styles.logoBackground}>
            <Logo size={24} />
          </View>
        </View>
        <Text style={styles.header}>{t('confirmTransaction')}</Text>
        <Text style={styles.description}>{t('jumpstartReclaim.description')}</Text>
        <DataFieldWithCopy
          label={t('walletConnectRequest.transactionDataLabel')}
          value={JSON.stringify(reclaimTx)}
          copySuccessMessage={t('walletConnectRequest.transactionDataCopied')}
          testID="JumpstarReclaimBottomSheet/RequestPayload"
        />
        {reclaimTx && (
          <EstimatedNetworkFee networkId={transaction.networkId} transaction={reclaimTx} />
        )}
        {/* TODO: Implement confirm */}
        <Button
          text={t('confirm')}
          onPress={() => Logger.debug('confirmed')}
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
  logoShadow: {
    ...getShadowStyle(Shadow.SoftLight),
    borderRadius: 100,
  },
  logoBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
    borderRadius: 100,
    backgroundColor: Colors.white,
  },
})

export default JumpstartTransactionDetailsScreen
