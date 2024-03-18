import BigNumber from 'bignumber.js'
import React from 'react'
import { useAsync } from 'react-async-hook'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import walletJumpstart from 'src/abis/IWalletJumpstart'
import Button, { BtnSizes } from 'src/components/Button'
import LineItemRow from 'src/components/LineItemRow'
import TokenDisplay from 'src/components/TokenDisplay'
import TokenIcon, { IconSize } from 'src/components/TokenIcon'
import Checkmark from 'src/icons/Checkmark'
import { getJumpstartContractAddress } from 'src/jumpstart/selectors'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import NetworkFeeRowItem from 'src/transactions/feed/detailContent/NetworkFeeRowItem'
import { NetworkId, TokenTransactionTypeV2, TokenTransfer } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { publicClient } from 'src/viem'
import { networkIdToNetwork } from 'src/web3/networkConfig'
import { Address, Hash, decodeEventLog } from 'viem'

const TAG = 'JumpstartContent'

async function getRewardDataAndStatus(networkId: NetworkId, transactionHash: Hash) {
  const jumpstartContractAddress = getJumpstartContractAddress(networkId)
  const viemClient = publicClient[networkIdToNetwork[networkId]]

  const transactionReceipt = await viemClient.getTransactionReceipt({
    hash: transactionHash,
  })

  const { eventName, args } = decodeEventLog({
    abi: walletJumpstart.abi,
    data: transactionReceipt.logs[1].data,
    topics: transactionReceipt.logs[1].topics,
  }) as { eventName: string; args: any }

  if (!['ERC20Deposited', 'ERC721Deposited'].includes(eventName)) {
    // Sanity check for the event name
    throw new Error(`Unexpected event name ${eventName}`)
  }

  const { beneficiary, index }: { beneficiary: Address; index: number } = args

  Logger.debug('Decoded event', { beneficiary, index })

  const erc20Claim = await viemClient.readContract({
    address: jumpstartContractAddress as Address,
    abi: walletJumpstart.abi,
    functionName: 'erc20Claims',
    args: [beneficiary, index],
  })

  // @ts-ignore
  const claimed: boolean = erc20Claim[3]

  Logger.debug(`Reward deposited in ${transactionHash} ${claimed ? 'was' : 'was NOT'} claimed`)

  return { beneficiary, index: Number(index), claimed }
}

function JumpstartContent({ transfer }: { transfer: TokenTransfer }) {
  const { t } = useTranslation()
  const transferTokenInfo = useTokenInfo(transfer.amount.tokenId)

  const parsedAmount = new BigNumber(transfer.amount.value).abs()
  const token = useTokenInfo(transfer.amount.tokenId)
  const isDeposit = transfer.type === TokenTransactionTypeV2.Sent

  const fetchEscrowData = useAsync(
    async () => {
      if (!isDeposit) {
        return
      }

      return await getRewardDataAndStatus(transfer.networkId, transfer.transactionHash as Hash)
    },
    [],
    {
      onError: (error) => {
        // Show error message in the UI
        Logger.error(TAG, 'Failed to fetch escrow data', error)
      },
    }
  )

  if (!token) {
    // should never happen
    Logger.error(TAG, 'Token is undefined')
    return null
  }

  const ClaimedLabel = () => (
    <View style={[styles.claimedContainer]}>
      <>
        <Text style={[styles.claimedText]}>{'Claimed'}</Text>
        <Checkmark color={Colors.successDark} width={Spacing.Thick24} height={Spacing.Thick24} />
      </>
    </View>
  )

  const ReclaimButton = () => (
    <View style={styles.buttonContainer}>
      {fetchEscrowData.result?.claimed ? (
        <ClaimedLabel />
      ) : (
        <Button
          showLoading={fetchEscrowData.loading}
          disabled={fetchEscrowData.loading}
          onPress={() => console.log('pressed')}
          text={t('reclaim')}
          size={BtnSizes.FULL}
        />
      )}
    </View>
  )

  return (
    <>
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
      {isDeposit && <ReclaimButton />}
      <NetworkFeeRowItem fees={transfer.fees} transactionStatus={transfer.status} />
      <LineItemRow
        testID="JumpstartContent/TokenDetails"
        title={isDeposit ? t('amountSent') : t('amountReceived')}
        textStyle={typeScale.labelSemiBoldMedium}
        style={styles.amountSentContainer}
        amount={
          <TokenDisplay
            amount={transfer.amount.value}
            tokenId={transfer.amount.tokenId}
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
            tOptions={{ symbol: transferTokenInfo?.symbol }}
          >
            <TokenDisplay
              amount={new BigNumber(1)}
              tokenId={transfer.amount.tokenId}
              showLocalAmount={true}
              testID="JumpstartContent/TransferTokenExchangeRate"
            />
          </Trans>
        }
        amount={
          <TokenDisplay
            amount={-transfer.amount.value}
            tokenId={transfer.amount.tokenId}
            showLocalAmount={true}
            hideSign={true}
            testID="JumpstartContent/AmountSentValueFiat"
          />
        }
        style={styles.tokenFiatValueContainer}
        textStyle={styles.tokenFiatValueText}
      />
    </>
  )
}

const styles = StyleSheet.create({
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
  claimedContainer: {
    backgroundColor: Colors.successLight,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.Small12,
    borderRadius: 100,
    gap: Spacing.Smallest8,
  },
  claimedText: {
    ...typeScale.labelSemiBoldMedium,
    color: Colors.successDark,
  },
  amountRow: {
    flexDirection: 'row',
  },
})

export default JumpstartContent
