import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Touchable from 'src/components/Touchable'
import BackChevronStatic from 'src/icons/BackChevronStatic'
import InfoShadowedIcon from 'src/icons/InfoShadowedIcon'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export default function NftsLoadErrorScreen() {
  const { t } = useTranslation()
  return (
    <SafeAreaView style={styles.safeArea} testID="NftsInfoCarousel/NftsLoadErrorScreen">
      <TopBarIconButton
        style={styles.topBarButton}
        icon={<BackChevronStatic />}
        onPress={navigateBack}
        testID="NftsLoadErrorScreen/BackButton"
      />
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
          testID="NftsLoadErrorScreen/ContactSupport"
          onPress={() => navigate(Screens.SupportContact)}
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
    // Same as the marginTop of the icon in SwapExecuteScreen.tsx
    marginTop: '32%',
    marginBottom: Spacing.Thick24,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    marginHorizontal: Spacing.Thick24,
  },
  subTitle: {
    ...fontStyles.large,
    marginBottom: Spacing.Regular16,
    textAlign: 'center',
  },
  title: {
    ...fontStyles.h1,
    marginBottom: Spacing.Thick24,
  },
  topBarButton: {
    margin: Spacing.Smallest8,
  },
})
