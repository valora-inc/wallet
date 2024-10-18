import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import { ActionCard } from 'src/earn/BeforeDepositBottomSheet'
import { WithdrawActionName } from 'src/earn/types'
import Claim from 'src/icons/Claim'
import Exit from 'src/icons/Exit'
import QuickActionsWithdraw from 'src/icons/quick-actions/Withdraw'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { ClaimType, EarnPosition } from 'src/positions/types'
import { getFeatureGate } from 'src/statsig'
import { StatsigFeatureGates } from 'src/statsig/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

function PartialWithdrawAction({
  forwardedRef,
  pool,
  hasRewards,
}: {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  pool: EarnPosition
  hasRewards: boolean
}) {
  const { t } = useTranslation()

  const action = {
    name: WithdrawActionName.Withdraw,
    title:
      hasRewards && pool.dataProps.withdrawalIncludesClaim
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaim')
        : t('earnFlow.poolInfoScreen.withdraw'),
    details:
      hasRewards && pool.dataProps.withdrawalIncludesClaim
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaimDescription')
        : t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawDescription'),
    iconComponent: QuickActionsWithdraw,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_select_withdraw_type, { type: 'partialWithdraw' })
      navigate(Screens.EarnEnterAmount, { pool, mode: 'withdraw' })
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function ClaimAction({
  forwardedRef,
  pool,
}: {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  pool: EarnPosition
}) {
  const { t } = useTranslation()
  const claimType = pool.dataProps.claimType

  const action = {
    name: WithdrawActionName.Claim,
    title:
      claimType === ClaimType.Rewards
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimRewards')
        : t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimEarnings'),
    details:
      claimType === ClaimType.Rewards
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimRewardsDescription')
        : t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimEarningsDescription'),
    iconComponent: Claim,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_select_withdraw_type, { type: 'claim' })
      navigate(Screens.EarnCollectScreen, { pool }) // TODO (ACT-1389): Confirmation screen for Claim
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

function ExitAction({
  forwardedRef,
  pool,
  hasRewards,
}: {
  forwardedRef: React.RefObject<BottomSheetModalRefType>
  pool: EarnPosition
  hasRewards: boolean
}) {
  const { t } = useTranslation()

  const claimType = pool.dataProps.claimType
  const details = hasRewards
    ? claimType === ClaimType.Rewards
      ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.exitWithRewardsDescription')
      : t('earnFlow.poolInfoScreen.withdrawBottomSheet.exitWithEarningsDescription')
    : t('earnFlow.poolInfoScreen.withdrawBottomSheet.exitDescription')

  const action = {
    name: WithdrawActionName.Exit,
    title: t('earnFlow.poolInfoScreen.withdrawBottomSheet.exit'),
    details,
    iconComponent: Exit,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_select_withdraw_type, { type: 'exit' })
      navigate(Screens.EarnCollectScreen, { pool }) // TODO (ACT-1389): Confirmation screen for Claim & Withdraw
      forwardedRef.current?.close()
    },
  }
  return <ActionCard action={action} />
}

export default function WithdrawBottomSheet({
  forwardedRef,
  pool,
  canClaim,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  pool: EarnPosition
  canClaim: boolean
}) {
  const { t } = useTranslation()
  const canPartialWithdraw = getFeatureGate(StatsigFeatureGates.ALLOW_EARN_PARTIAL_WITHDRAWAL)

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('earnFlow.poolInfoScreen.withdrawBottomSheet.title')}
      titleStyle={styles.bottomSheetTitle}
      testId={'Earn/WithdrawBottomSheet'}
    >
      <View style={styles.actionsContainer}>
        {canPartialWithdraw && (
          <PartialWithdrawAction forwardedRef={forwardedRef} pool={pool} hasRewards={canClaim} />
        )}
        {canClaim && <ClaimAction forwardedRef={forwardedRef} pool={pool} />}
        <ExitAction forwardedRef={forwardedRef} pool={pool} hasRewards={canClaim} />
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  actionsContainer: {
    flex: 1,
    gap: Spacing.Regular16,
    marginVertical: Spacing.Thick24,
  },
  bottomSheetTitle: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
})
