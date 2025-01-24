import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { EarnEvents } from 'src/analytics/Events'
import BottomSheet, { BottomSheetModalRefType } from 'src/components/BottomSheet'
import { ActionCard } from 'src/earn/ActionCard'
import { WithdrawAction } from 'src/earn/types'
import Exit from 'src/icons/Exit'
import QuickActionsWithdraw from 'src/icons/quick-actions/Withdraw'
import Trophy from 'src/icons/Trophy'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { EarnPosition } from 'src/positions/types'
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
  const claimType = pool.dataProps.claimType

  const action: WithdrawAction = {
    name: 'withdraw',
    title:
      hasRewards && pool.dataProps.withdrawalIncludesClaim
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaim')
        : t('earnFlow.poolInfoScreen.withdraw'),
    details:
      hasRewards && pool.dataProps.withdrawalIncludesClaim
        ? claimType === 'rewards'
          ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaimRewardsDescription')
          : t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawAndClaimEarningsDescription')
        : t('earnFlow.poolInfoScreen.withdrawBottomSheet.withdrawDescription'),
    iconComponent: QuickActionsWithdraw,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_select_withdraw_type, {
        type: 'withdraw',
        providerId: pool.appId,
        poolId: pool.positionId,
        networkId: pool.networkId,
        depositTokenId: pool.dataProps.depositTokenId,
      })
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

  const action: WithdrawAction = {
    name: 'claim-rewards',
    title:
      claimType === 'rewards'
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimRewards')
        : t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimEarnings'),
    details:
      claimType === 'rewards'
        ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimRewardsDescription')
        : t('earnFlow.poolInfoScreen.withdrawBottomSheet.claimEarningsDescription'),
    iconComponent: Trophy,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_select_withdraw_type, {
        type: 'claim-rewards',
        providerId: pool.appId,
        poolId: pool.positionId,
        networkId: pool.networkId,
        depositTokenId: pool.dataProps.depositTokenId,
      })
      navigate(Screens.EarnConfirmationScreen, { pool, mode: 'claim-rewards', useMax: true })
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
    ? claimType === 'rewards'
      ? t('earnFlow.poolInfoScreen.withdrawBottomSheet.exitWithRewardsDescription')
      : t('earnFlow.poolInfoScreen.withdrawBottomSheet.exitWithEarningsDescription')
    : t('earnFlow.poolInfoScreen.withdrawBottomSheet.exitDescription')

  const action: WithdrawAction = {
    name: 'exit',
    title: t('earnFlow.poolInfoScreen.withdrawBottomSheet.exit'),
    details,
    iconComponent: Exit,
    onPress: () => {
      AppAnalytics.track(EarnEvents.earn_select_withdraw_type, {
        type: 'exit',
        providerId: pool.appId,
        poolId: pool.positionId,
        networkId: pool.networkId,
        depositTokenId: pool.dataProps.depositTokenId,
      })
      navigate(Screens.EarnConfirmationScreen, { pool, mode: 'exit', useMax: true })
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

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('earnFlow.poolInfoScreen.withdrawBottomSheet.title')}
      titleStyle={styles.bottomSheetTitle}
      testId={'Earn/WithdrawBottomSheet'}
    >
      <View style={styles.actionsContainer}>
        <PartialWithdrawAction forwardedRef={forwardedRef} pool={pool} hasRewards={canClaim} />
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
