import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useActions } from 'src/tokens/TokenDetails'
import { TokenBalance } from 'src/tokens/slice'

export default function MoreActionsBottomSheet({
  forwardedRef,
  token,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  token: TokenBalance
}) {
  const { t } = useTranslation()
  const actions = useActions(token)
  return (
    <BottomSheet
      title={t('tokenDetails.moreActions')}
      forwardedRef={forwardedRef}
      testId="MoreActionsBottomSheet"
    >
      <View style={styles.actionsContainer}>
        {actions.map((action) => {
          return (
            <View style={styles.actionContainer}>
              <Touchable
                onPress={action.onPress}
                testID={`action/${action.name}`}
                borderRadius={20}
                style={styles.touchable}
              >
                <View style={styles.touchableView}>
                  <action.iconComponent color={Colors.dark} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.actionTitle}>{action.text}</Text>
                    <Text style={styles.actionDetails}>{action.details}</Text>
                  </View>
                </View>
              </Touchable>
            </View>
          )
        })}
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  actionsContainer: {
    gap: Spacing.Regular16,
  },
  actionContainer: {
    backgroundColor: Colors.gray1,
    borderRadius: 20,
  },
  touchable: {
    padding: Spacing.Regular16,
  },
  touchableView: {
    flexDirection: 'row',
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
  actionTitle: {
    ...typeScale.labelMedium,
  },
  actionDetails: {
    ...typeScale.bodySmall,
  },
})
