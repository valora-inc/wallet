import { BigNumber } from 'bignumber.js'
import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Button, { BtnSizes } from 'src/components/Button'
import DataFieldWithCopy from 'src/components/DataFieldWithCopy'
import TokenDisplay from 'src/components/TokenDisplay'
import { headerWithBackButton } from 'src/navigator/Headers'
import {
  getClaimableRewardId,
  pendingAcceptanceShortcutSelector,
  positionsWithClaimableRewardsSelector,
} from 'src/positions/selectors'
import { denyExecuteShortcut, executeShortcut, triggerShortcut } from 'src/positions/slice'
import { ClaimablePosition } from 'src/positions/types'
import { default as colors, default as Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { Currency } from 'src/utils/currencies'
import Logger from 'src/utils/Logger'
import DappsDisclaimer from 'src/walletConnect/screens/DappsDisclaimer'
import RequestContent from 'src/walletConnect/screens/RequestContent'
import { walletAddressSelector } from 'src/web3/selectors'

function DappShortcutsRewards() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()
  const confirmBottomSheetRef = useRef<BottomSheetRefType>(null)

  const address = useSelector(walletAddressSelector)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)
  const pendingAcceptShortcut = useSelector(pendingAcceptanceShortcutSelector)

  const [claimablePositions, setClaimablePositions] = useState(positionsWithClaimableRewards)

  useEffect(() => {
    setClaimablePositions((prev) => {
      // update the displayed rewards in place, so they do not change order and
      // claimed rewards can remain on the screen even if the reward disappears
      // after being claimed on data is refreshed
      const updatedPositions: ClaimablePosition[] = prev.map((reward) => {
        const updatedReward = positionsWithClaimableRewards.find(
          (position) => position.address === reward.address
        )
        return (
          updatedReward ?? {
            ...reward,
            status: 'success',
          }
        )
      })

      // add any new claimable positions to the end of the list
      const newClaimablePositions = positionsWithClaimableRewards.filter(
        (position) => !prev.find((reward) => reward.address === position.address)
      )

      return [...updatedPositions, ...newClaimablePositions]
    })
  }, [positionsWithClaimableRewards])

  useEffect(() => {
    if (!pendingAcceptShortcut) {
      confirmBottomSheetRef.current?.close()
    }
  }, [pendingAcceptShortcut])

  const handleConfirmClaimReward = (position: ClaimablePosition) => () => {
    if (!address) {
      // should never happen
      Logger.error('dapps/DappShortcutsRewards', 'No wallet address found when claiming reward')
      return
    }

    const rewardId = getClaimableRewardId(position.address, position.claimableShortcut)
    dispatch(
      triggerShortcut({
        id: rewardId,
        appName: position.appName,
        appImage: position.displayProps.imageUrl,
        data: {
          address,
          appId: position.appId,
          network: 'celo',
          positionAddress: position.address,
          shortcutId: position.claimableShortcut.id,
        },
      })
    )
    confirmBottomSheetRef.current?.snapToIndex(0)
  }

  const handleClaimReward = () => {
    if (!pendingAcceptShortcut) {
      // should never happen
      Logger.error('dapps/DappShortcutsRewards', 'No in progress reward found when claiming reward')
      return
    }

    dispatch(executeShortcut(pendingAcceptShortcut.id))
  }

  const renderItem = ({ item }: { item: ClaimablePosition }) => {
    let claimableValueUsd = new BigNumber(0)
    item.claimableShortcut.claimableTokens.forEach((token) => {
      claimableValueUsd = claimableValueUsd.plus(
        BigNumber(token.priceUsd).times(BigNumber(token.balance))
      )
    })
    const allowClaim = item.status === 'idle' || item.status === 'error'
    const loading =
      item.status === 'loading' || item.status === 'pendingAccept' || item.status === 'accepting'

    return (
      <View style={styles.card} testID="DappShortcutsRewards/Card">
        <View style={styles.rewardInfoContainer}>
          <View style={styles.rewardAmountContainer}>
            <Text style={styles.rewardLabel}>
              {t('dappShortcuts.claimRewardsScreen.rewardLabel')}
            </Text>

            <Text style={styles.rewardAmount} testID="DappShortcutsRewards/RewardAmount">
              {item.claimableShortcut.claimableTokens.map((token, index) => (
                <React.Fragment key={token.address}>
                  {index > 0 && ', '}
                  <TokenDisplay
                    amount={token.balance}
                    tokenAddress={token.address}
                    showLocalAmount={false}
                  />
                </React.Fragment>
              ))}
            </Text>
            {claimableValueUsd && (
              <TokenDisplay
                style={styles.rewardFiatAmount}
                amount={claimableValueUsd}
                currency={Currency.Dollar}
                showLocalAmount={true}
                testID="DappShortcutsRewards/RewardAmountFiat"
              />
            )}
          </View>
          <Button
            onPress={handleConfirmClaimReward(item)}
            text={
              item.status === 'success'
                ? t('dappShortcuts.claimRewardsScreen.claimedLabel')
                : t('dappShortcuts.claimRewardsScreen.claimButton')
            }
            showLoading={loading}
            disabled={!allowClaim}
            size={BtnSizes.SMALL}
            touchableStyle={styles.claimButton}
            testID="DappShortcutsRewards/ClaimButton"
          />
        </View>
        <View style={styles.dappInfoContainer}>
          <Image source={{ uri: item.displayProps.imageUrl }} style={styles.dappLogo} />
          <Text style={styles.dappName}>{item.appName}</Text>
        </View>
      </View>
    )
  }

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <Text style={styles.heading}>{t('dappShortcuts.claimRewardsScreen.title')}</Text>
        <Text style={styles.subHeading}>{t('dappShortcuts.claimRewardsScreen.description')}</Text>
      </View>
    )
  }

  const handleTrackCopyTransactionDetails = () => {
    // TODO
  }

  const handleDenyTransaction = () => {
    if (pendingAcceptShortcut) {
      dispatch(denyExecuteShortcut(pendingAcceptShortcut.id))
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.FlatList
        contentContainerStyle={{
          paddingHorizontal: Spacing.Thick24,
          paddingBottom: insets.bottom,
        }}
        scrollEventThrottle={16}
        renderItem={renderItem}
        data={claimablePositions}
        ListHeaderComponent={renderHeader}
      />

      <BottomSheet
        forwardedRef={confirmBottomSheetRef}
        onDismiss={handleDenyTransaction}
        testId="DappShortcutsRewards/ConfirmClaimBottomSheet"
      >
        {pendingAcceptShortcut?.transactions?.length ? (
          <RequestContent
            onAccept={handleClaimReward}
            onDeny={handleDenyTransaction}
            dappName={pendingAcceptShortcut.appName}
            dappImageUrl={pendingAcceptShortcut.appImage}
            title={t('confirmTransaction')}
            description={t('walletConnectRequest.sendTransaction', {
              dappName: pendingAcceptShortcut.appName,
            })}
            testId="DappShortcutsRewards/ConfirmClaimBottomSheet"
          >
            <DataFieldWithCopy
              label={t('walletConnectRequest.transactionDataLabel')}
              value={JSON.stringify(pendingAcceptShortcut.transactions)}
              testID="DappShortcutsRewards/RewardTransactionData"
              onCopy={handleTrackCopyTransactionDetails}
            />
            <DappsDisclaimer isDappListed={true} />
          </RequestContent>
        ) : (
          <ActivityIndicator color={colors.greenBrand} style={styles.loader} />
        )}
      </BottomSheet>
    </SafeAreaView>
  )
}

DappShortcutsRewards.navigationOptions = () => ({
  ...headerWithBackButton,
  headerTransparent: true,
  headerStyle: {
    backgroundColor: 'transparent',
  },
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.Large32,
  },
  card: {
    borderWidth: 1,
    borderColor: Colors.gray2,
    borderRadius: 12,
    marginBottom: Spacing.Regular16,
  },
  rewardInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
  },
  rewardAmountContainer: {
    flex: 1,
    marginRight: Spacing.Small12,
  },
  rewardLabel: {
    ...fontStyles.xsmall,
    color: Colors.gray3,
  },
  rewardAmount: {
    ...fontStyles.large600,
    lineHeight: 28,
    flexWrap: 'wrap',
  },
  rewardFiatAmount: {
    ...fontStyles.small,
  },
  dappInfoContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.Regular16,
    paddingVertical: Spacing.Small12,
    backgroundColor: Colors.gray1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  dappLogo: {
    width: 18,
    height: 18,
    marginRight: Spacing.Smallest8,
    backgroundColor: Colors.light,
    borderRadius: 100,
  },
  dappName: {
    ...fontStyles.small600,
  },
  headerContainer: {
    paddingVertical: Spacing.Thick24,
  },
  heading: {
    ...fontStyles.large600,
    fontSize: 24,
    lineHeight: 32,
    marginBottom: Spacing.Tiny4,
  },
  subHeading: {
    ...fontStyles.small,
    color: Colors.gray3,
  },
  claimButton: {
    minWidth: 72,
  },
  loader: {
    marginVertical: Spacing.Thick24,
  },
})

export default DappShortcutsRewards
