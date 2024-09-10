import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { AssetsEvents } from 'src/analytics/Events'
import BottomSheetV2, { BottomSheetModalRefType } from 'src/components/BottomSheetV2'
import Touchable from 'src/components/Touchable'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { TokenBalance } from 'src/tokens/slice'
import { TokenAction } from 'src/tokens/types'
import { getTokenAnalyticsProps } from 'src/tokens/utils'

export default function TokenDetailsMoreActions({
  forwardedRef,
  actions,
  token,
}: {
  forwardedRef: RefObject<BottomSheetModalRefType>
  actions: TokenAction[]
  token: TokenBalance
}) {
  const { t } = useTranslation()

  return (
    <BottomSheetV2
      forwardedRef={forwardedRef}
      title={t('tokenDetails.moreActions')}
      testId="TokenDetailsMoreActions"
      titleStyle={styles.title}
    >
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <Touchable
            style={styles.touchable}
            key={action.name}
            borderRadius={20}
            onPress={() => {
              AppAnalytics.track(AssetsEvents.tap_token_details_bottom_sheet_action, {
                action: action.name,
                ...getTokenAnalyticsProps(token),
              })
              action.onPress()
              forwardedRef.current?.dismiss()
            }}
            testID={`TokenDetailsMoreActions/${action.name}`}
          >
            <>
              <action.iconComponent color={Colors.black} />
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionDetails}>{action.details}</Text>
              </View>
            </>
          </Touchable>
        ))}
      </View>
    </BottomSheetV2>
  )
}

const styles = StyleSheet.create({
  actionsContainer: {
    flex: 1,
    gap: Spacing.Regular16,
  },
  actionTitle: {
    ...typeScale.labelMedium,
  },
  actionDetails: {
    ...typeScale.bodySmall,
  },
  title: {
    ...typeScale.labelLarge,
  },
  touchable: {
    backgroundColor: Colors.gray1,
    padding: Spacing.Regular16,
    flexDirection: 'row',
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
})
