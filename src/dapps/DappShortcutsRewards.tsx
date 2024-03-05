import { BigNumber } from 'bignumber.js'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DappShortcutsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Button, { BtnSizes } from 'src/components/Button'
import LegacyTokenDisplay from 'src/components/LegacyTokenDisplay'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import {
  getClaimableRewardId,
  positionsWithClaimableRewardsSelector,
} from 'src/positions/selectors'
import { triggerShortcut } from 'src/positions/slice'
import { ClaimablePosition } from 'src/positions/types'
import { useDispatch, useSelector } from 'src/redux/hooks'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'
import { Currency } from 'src/utils/currencies'
import { walletAddressSelector } from 'src/web3/selectors'

function DappShortcutsRewards() {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()

  const address = useSelector(walletAddressSelector)
  const positionsWithClaimableRewards = useSelector(positionsWithClaimableRewardsSelector)

  const [claimablePositions, setClaimablePositions] = useState(positionsWithClaimableRewards)

  useEffect(() => {
    ValoraAnalytics.track(DappShortcutsEvents.dapp_shortcuts_rewards_screen_open, {
      numRewards: positionsWithClaimableRewards.length,
    })
  }, [])

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

  const createConfirmClaimRewardHandler =
    (position: ClaimablePosition, claimableValueUsd: BigNumber) => () => {
      if (!address) {
        // should never happen
        Logger.error('dapps/DappShortcutsRewards', 'No wallet address found when claiming reward')
        return
      }

      const { appName, displayProps, claimableShortcut, appId } = position
      const rewardId = getClaimableRewardId(position.address, claimableShortcut)

      ValoraAnalytics.track(DappShortcutsEvents.dapp_shortcuts_reward_claim_start, {
        appName,
        shortcutId: claimableShortcut.id,
        rewardId,
        appId,
        network: 'celo',
        rewardTokens: claimableShortcut.claimableTokens.map((token) => token.symbol).join(', '),
        rewardAmounts: claimableShortcut.claimableTokens.map((token) => token.balance).join(', '),
        claimableValueUsd: claimableValueUsd.toString(),
      })

      dispatch(
        triggerShortcut({
          id: rewardId,
          appName,
          appImage: displayProps.imageUrl,
          data: {
            address,
            appId,
            network: 'celo',
            positionAddress: position.address,
            shortcutId: claimableShortcut.id,
          },
        })
      )
      navigate(Screens.DappShortcutTransactionRequest, { rewardId })
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
                  <LegacyTokenDisplay
                    amount={token.balance}
                    tokenAddress={token.address}
                    showLocalAmount={false}
                  />
                </React.Fragment>
              ))}
            </Text>
            {claimableValueUsd.gt(0) && (
              <LegacyTokenDisplay
                style={styles.rewardFiatAmount}
                amount={claimableValueUsd}
                currency={Currency.Dollar}
                showLocalAmount={true}
                testID="DappShortcutsRewards/RewardAmountFiat"
              />
            )}
            {item.status === 'accepting' && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>
                  {t('dappShortcuts.claimRewardsScreen.confirmingReward')}
                </Text>
              </View>
            )}
          </View>
          <Button
            onPress={createConfirmClaimRewardHandler(item, claimableValueUsd)}
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

  return (
    <>
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
    </>
  )
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.white,
    borderRadius: 100,
  },
  dappName: {
    ...fontStyles.small600,
  },
  headerContainer: {
    paddingTop: Spacing.Smallest8,
    paddingBottom: Spacing.Thick24,
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
  chip: {
    marginTop: Spacing.Smallest8,
    backgroundColor: Colors.infoLight,
    paddingVertical: 2,
    paddingHorizontal: Spacing.Smallest8,
    borderRadius: 100,
    alignSelf: 'flex-start', // prevent from defaulting to full width of container
  },
  chipText: {
    ...fontStyles.xsmall600,
    fontSize: 10,
    lineHeight: 12,
  },
})

export default DappShortcutsRewards
