import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import QuickActionsAdd from 'src/icons/quick-actions/Add'
import QuickActionsSend from 'src/icons/quick-actions/Send'
import QuickActionsSwap from 'src/icons/quick-actions/Swap'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenActionName } from 'src/tokens/types'

export type AddAssetsActionType =
  | TokenActionName.Add
  | TokenActionName.Transfer
  | TokenActionName.Swap
  | TokenActionName.SwapAndDeposit
  | TokenActionName.CrossChainSwap

export interface AddAssetsAction {
  name: AddAssetsActionType
  details: string
  onPress: () => void
}

export default function AddAssetsBottomSheet({
  forwardedRef,
  actions,
  title,
  description,
  testId,
  showDescriptionAfterFirstAction,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  actions: AddAssetsAction[]
  title: string
  description: string
  testId: string
  showDescriptionAfterFirstAction?: boolean
}) {
  const { t } = useTranslation()

  const actionExtraProps = {
    [TokenActionName.Add]: {
      iconComponent: QuickActionsAdd,
      title: t('addFundsActions.add'),
    },
    [TokenActionName.Transfer]: {
      iconComponent: QuickActionsSend,
      title: t('addFundsActions.transfer'),
    },
    [TokenActionName.Swap]: {
      iconComponent: QuickActionsSwap,
      title: t('addFundsActions.swap'),
    },
    [TokenActionName.SwapAndDeposit]: {
      iconComponent: QuickActionsAdd,
      title: t('addFundsActions.swapAndDeposit'),
    },
    [TokenActionName.CrossChainSwap]: {
      iconComponent: QuickActionsSwap,
      title: t('addFundsActions.crossChainSwap'),
    },
  }

  const addAssetsActions = actions.map((action) => ({
    ...action,
    ...actionExtraProps[action.name],
  }))

  const beforeDescriptionAction = addAssetsActions[0]
  const afterDescriptionActions = addAssetsActions.slice(showDescriptionAfterFirstAction ? 1 : 0)

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={title}
      description={!showDescriptionAfterFirstAction ? description : undefined}
      titleStyle={styles.title}
      testId={testId}
    >
      <View style={styles.actionsContainer}>
        {showDescriptionAfterFirstAction && (
          <Touchable
            style={styles.touchable}
            key={beforeDescriptionAction.name}
            borderRadius={20}
            onPress={beforeDescriptionAction.onPress}
            testID={`${testId}/${beforeDescriptionAction.name}`}
          >
            <>
              <beforeDescriptionAction.iconComponent color={Colors.black} />
              <View style={styles.contentContainer}>
                <Text style={styles.actionTitle}>{beforeDescriptionAction.title}</Text>
                <Text style={styles.actionDetails}>{beforeDescriptionAction.details}</Text>
              </View>
            </>
          </Touchable>
        )}
        {showDescriptionAfterFirstAction && <Text style={styles.actionDetails}>{description}</Text>}
        {afterDescriptionActions.map((action) => (
          <Touchable
            style={styles.touchable}
            key={action.name}
            borderRadius={20}
            onPress={action.onPress}
            testID={`${testId}/${action.name}`}
          >
            <>
              <action.iconComponent color={Colors.black} />
              <View style={styles.contentContainer}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDetails}>{action.details}</Text>
              </View>
            </>
          </Touchable>
        ))}
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
  actionTitle: {
    ...typeScale.labelMedium,
    color: Colors.black,
  },
  actionDetails: {
    ...typeScale.bodySmall,
    color: Colors.black,
  },
  title: {
    ...typeScale.titleSmall,
    color: Colors.black,
  },
  touchable: {
    backgroundColor: Colors.gray1,
    padding: Spacing.Regular16,
    flexDirection: 'row',
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
  },
})
