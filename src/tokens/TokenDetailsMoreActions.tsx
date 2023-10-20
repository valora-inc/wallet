import React, { RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheet, { BottomSheetRefType } from 'src/components/BottomSheet'
import Touchable from 'src/components/Touchable'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenDetailsAction } from 'src/tokens/types'
import { getTokenAnalyticsProps } from 'src/tokens/utils'

export default function TokenDetailsMoreActions({
  forwardedRef,
  actions,
  tokenId,
}: {
  forwardedRef: RefObject<BottomSheetRefType>
  actions: TokenDetailsAction[]
  tokenId: string
}) {
  const { t } = useTranslation()
  const token = useTokenInfo(tokenId)
  if (!token) throw new Error(`Token ${tokenId} not found`)

  return (
    <BottomSheet
      forwardedRef={forwardedRef}
      title={t('tokenDetails.moreActions')}
      testId={'TokenDetailsMoreActions'}
    >
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <Touchable
            style={styles.touchable}
            key={action.name}
            borderRadius={20}
            onPress={() => {
              ValoraAnalytics.track(AssetsEvents.tap_token_details_bottom_sheet_action, {
                action: action.name,
                ...getTokenAnalyticsProps(token),
              })
              action.onPress()
            }}
          >
            <>
              <action.iconComponent color={Colors.dark} />
              <View style={{ flex: 1 }}>
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
  },
  actionTitle: {
    ...typeScale.labelMedium,
  },
  actionDetails: {
    ...typeScale.bodySmall,
  },
  touchable: {
    backgroundColor: Colors.gray1,
    padding: Spacing.Regular16,
    flexDirection: 'row',
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
})
