import { isNil, noop } from 'lodash'
import React from 'react'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'

import Button, { BtnSizes } from 'src/components/Button'
import Touchable from 'src/components/Touchable'
import ShareIcon from 'src/icons/Share'
import Times from 'src/icons/Times'
import { inviteModal } from 'src/images/Images'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { walletAddressSelector } from 'src/web3/selectors'

/**
 * TODO:
 * - Translate text.
 */

import { useShareUrl } from './Invite.hooks'
import { share } from './Invite.utils'

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
  const address = useSelector(walletAddressSelector)
  const shareUrl = useShareUrl(address)

  return (
    <View style={styles.outerContentContainer}>
      <View style={styles.innerContentContainer}>
        <Image style={styles.art} source={inviteModal} />
        <Text style={styles.title}>Invite a Friend</Text>
        <Text style={styles.body}>
          Connect and share value with your friends and family on Valora
        </Text>
        <Button
          iconPositionLeft={false}
          icon={<ShareIcon height={24} color="white" />}
          text={'Share Invite'}
          size={BtnSizes.SMALL}
          disabled={isNil(shareUrl)}
          onPress={() => (isNil(shareUrl) ? noop : share(shareUrl))}
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
    paddingBottom: 56 * 2,
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
    marginHorizontal: 24,
    flex: 1,
  },
  headerContainer: {
    height: 56,
    width: '100%',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
