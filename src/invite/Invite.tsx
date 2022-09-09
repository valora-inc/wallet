import { noop } from 'lodash'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Button, { BtnSizes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { inviteModal } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import variables from 'src/styles/variables'

function Header() {
  return (
    <View style={styles.headerContainer}>
      <Touchable onPress={navigateBack} borderless={true} hitSlop={variables.iconHitslop}>
        <Times />
      </Touchable>
    </View>
  )
}

function Content() {
  const { t } = useTranslation()
  return (
    <View style={styles.outerContentContainer}>
      <View style={styles.innerContentContainer}>
        <Image style={styles.art} source={inviteModal} />
        <Text style={styles.title}>{t('inviteWithUrl.title')}</Text>
        <Text style={styles.body}>{t('inviteWithUrl.body')}</Text>
        <Button
          iconPositionLeft={false}
          icon={<ShareIcon height={24} color="white" />}
          text={t('inviteWithUrl.button')}
          size={BtnSizes.SMALL}
          onPress={noop}
        />
      </View>
    </View>
  )
}

export default function Invite() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Header />
        <Content />
      </ScrollView>
    </SafeAreaView>
  )
}

Invite.navOptions = noHeader

const styles = StyleSheet.create({
  art: {
    width: 136,
    height: 120,
  },
  outerContentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing.Smallest8 * 14,
  },
  innerContentContainer: {
    height: 280,
    width: 312,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    ...fontStyles.h2,
  },
  body: {
    ...fontStyles.regular,
    textAlign: 'center',
  },
  scrollView: {
    alignItems: 'center',
    marginHorizontal: Spacing.Thick24,
    flex: 1,
  },
  headerContainer: {
    height: Spacing.Smallest8 * 7,
    width: '100%',
    marginTop: Spacing.Small12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
