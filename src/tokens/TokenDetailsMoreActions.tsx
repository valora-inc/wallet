import { BottomSheetScreenProps } from '@th3rdwave/react-navigation-bottom-sheet'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { AssetsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Touchable from 'src/components/Touchable'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { Colors } from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { useActions } from 'src/tokens/TokenDetails'
import { useTokenInfo } from 'src/tokens/hooks'
import { TokenDetailsAction } from 'src/tokens/types'
import { getTokenAnalyticsProps } from 'src/tokens/utils'

type Props = BottomSheetScreenProps<StackParamList, Screens.TokenDetailsMoreActions>

export default function TokenDetailsMoreActions({ route }: Props) {
  const { t } = useTranslation()
  const { tokenId } = route.params
  const token = useTokenInfo(tokenId)

  if (!token) {
    throw new Error(`TokenId: ${tokenId} not found`)
  }

  const actions: TokenDetailsAction[] = useActions(token)

  return (
    <BottomSheetScrollView>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{t('tokenDetails.moreActions')}</Text>
      </View>
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
    </BottomSheetScrollView>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    paddingTop: Spacing.Smallest8,
    paddingBottom: Spacing.Regular16,
  },
  title: {
    ...typeScale.labelLarge,
  },
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
