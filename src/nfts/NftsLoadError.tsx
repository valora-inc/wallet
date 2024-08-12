import React, { useEffect } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import AppAnalytics from 'src/analytics/AppAnalytics'
import { NftEvents } from 'src/analytics/Events'
import Touchable from 'src/components/Touchable'
import RedLoadingSpinnerToInfo from 'src/icons/RedLoadingSpinnerToInfo'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

const TAG = 'NftsLoadErrorScreen'

interface Props {
  testID?: string
}

export default function NftsLoadError({ testID }: Props) {
  const { t } = useTranslation()
  function handleSupportPress() {
    Logger.debug(TAG, 'Support Contact pressed')
    navigate(Screens.SupportContact)
  }

  useEffect(() => {
    // Whenever this screen is mounted we've failed to load the NFTs from blockchain-api
    AppAnalytics.track(NftEvents.nft_error_screen_open)
  }, [])

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.contentContainerStyle}
        style={styles.scrollContainer}
      >
        <View style={styles.center}>
          <View style={styles.iconMargin}>
            <RedLoadingSpinnerToInfo />
          </View>
          <Text style={styles.title}>{t('nftsLoadErrorScreen.loadErrorTitle')}</Text>
          <Text style={styles.subTitle}>{t('nftsLoadErrorScreen.loadErrorSubtitle')}</Text>
        </View>
        <View style={styles.contactSupportTouchableContainer}>
          <Touchable
            testID="NftsLoadErrorScreen/ContactSupport"
            onPress={handleSupportPress}
            style={styles.contactSupportTouchable}
          >
            <Text style={styles.contactSupportText}>
              <Trans i18nKey="nftsLoadErrorScreen.contactSupport">
                <Text style={styles.contactSupportLink} />
              </Trans>
            </Text>
          </Touchable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
  },
  contactSupportText: {
    ...typeScale.bodySmall,
    textAlign: 'center',
    color: colors.gray3,
  },
  // Touchable are wrapped in a view to prevent the ripple effect from overflowing on Android
  contactSupportTouchableContainer: {
    borderRadius: Spacing.Large32,
    overflow: 'hidden',
  },
  contactSupportTouchable: {
    padding: Spacing.Regular16,
  },
  contactSupportLink: {
    color: colors.infoDark,
    textDecorationLine: 'underline',
  },
  contentContainerStyle: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconMargin: {
    marginTop: '32%',
    marginBottom: Spacing.Thick24,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    marginHorizontal: Spacing.Thick24,
  },
  subTitle: {
    ...typeScale.bodyMedium,
    textAlign: 'center',
    color: colors.gray3,
  },
  title: {
    ...typeScale.titleSmall,
    marginBottom: Spacing.Smallest8,
    textAlign: 'center',
  },
})
