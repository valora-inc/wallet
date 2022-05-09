import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showRaiseDailyLimitSelector } from 'src/app/selectors'
import { SettingsItemTextValue } from 'src/components/SettingsItem'
import { FAQ_LINK, FORUM_LINK } from 'src/config'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'
import fontStyles from 'src/styles/fonts'
import { navigateToURI } from 'src/utils/linking'

const openExternalLink = (link: string) => () => navigateToURI(link)

const onPressContact = () => {
  navigate(Screens.SupportContact)
}

const onPressRaiseLimit = () => {
  navigate(Screens.RaiseLimitScreen)
}

const Support = () => {
  const { t } = useTranslation()
  const showRaiseDailyLimit = useSelector(showRaiseDailyLimitSelector)

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <ScrollView>
        <Text style={styles.title} testID={'SettingsTitle'}>
          {t('help')}
        </Text>
        <View style={styles.containerList}>
          <SettingsItemTextValue
            testID="FAQLink"
            title={t('faq')}
            onPress={openExternalLink(FAQ_LINK)}
          />
          {showRaiseDailyLimit && (
            <SettingsItemTextValue
              testID="RaiseLimit"
              title={t('raiseLimit')}
              onPress={onPressRaiseLimit}
            />
          )}
          <SettingsItemTextValue
            testID="ForumLink"
            title={t('forum')}
            onPress={openExternalLink(FORUM_LINK)}
          />
          <SettingsItemTextValue
            testID="SupportContactLink"
            title={t('contact')}
            onPress={onPressContact}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerList: {
    flex: 1,
  },
  title: {
    ...fontStyles.h1,
    margin: 16,
  },
})

export default Support
