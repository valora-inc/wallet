import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import Touchable from 'src/components/Touchable'
import Times from 'src/icons/Times'
import { noHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
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

export default function Invite() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <Header />
        <Text>Foobar</Text>
      </View>
    </SafeAreaView>
  )
}

Invite.navOptions = noHeader

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  headerContainer: {
    width: '100%',
    marginTop: 12,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
