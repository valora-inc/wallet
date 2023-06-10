import React from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native'
import Touchable from 'src/components/Touchable'
import InfoShadowedIcon from 'src/icons/InfoShadowedIcon'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import Logger from 'src/utils/Logger'

const TAG = 'NftsLoadErrorScreen'

export default function NftsLoadError() {
  const { t } = useTranslation()
  function handleSupportPress() {
    Logger.debug(TAG, 'Support Contact pressed')
    navigate(Screens.SupportContact)
  }
  return (
    <SafeAreaView style={styles.safeArea} testID="NftsInfoCarousel/NftsLoadErrorScreen">
      <ScrollView
        contentContainerStyle={styles.contentContainerStyle}
        style={styles.scrollContainer}
      >
        <View style={styles.iconMargin}>
          <InfoShadowedIcon testID="NftsLoadErrorScreen/Icon" />
        </View>
        <Text style={styles.title}>{t('nftsLoadErrorScreen.loadErrorTitle')}</Text>
        <Text style={styles.subTitle}>{t('nftsLoadErrorScreen.loadErrorSubtitle')}</Text>
        <Touchable
          borderless={true}
          testID="NftsLoadErrorScreen/ContactSupport"
          onPress={handleSupportPress}
        >
          <Text style={styles.contactSupportTouchable}>
            {t('nftsLoadErrorScreen.contactSupport')}
          </Text>
        </Touchable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  contactSupportTouchable: {
    alignItems: 'center',
    ...fontStyles.large600,
    color: colors.onboardingGreen,
    textDecorationLine: 'underline',
  },
  contentContainerStyle: {
    flexGrow: 1,
    alignItems: 'center',
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
    ...fontStyles.large,
    marginBottom: Spacing.Regular16,
    textAlign: 'center',
    color: colors.gray3,
  },
  title: {
    ...fontStyles.h1,
    marginBottom: Spacing.Thick24,
    textAlign: 'center',
  },
  topBarButton: {
    margin: Spacing.Smallest8,
  },
})
