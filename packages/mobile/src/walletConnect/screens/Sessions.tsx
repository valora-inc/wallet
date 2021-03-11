import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import React from 'react'
import { Button, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { getSessions } from 'src/walletConnect/selectors'

export default function WalletConnectSessionsScreen() {
  const sessions = useSelector(getSessions)

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar />
      <View>
        <Text style={styles.title}>Connected Applications</Text>

        <Text style={styles.details}>
          Here you can connect Valora to decentralized applications (DApps) just by scanning a QR
          code.
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View>
          <Text>No connected applications, click here to get started</Text>
        </View>
      ) : (
        <View>
          {sessions.map((s) => (
            <View>
              <Text>{s.peer.metadata.name}</Text>

              <Button title="Kill" onPress={() => {}}></Button>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...fontStyles.h1,
    margin: 16,
  },
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingBottom: 16,
  },
  share: {
    ...fontStyles.regular,
    color: colors.gray4,
    textAlign: 'center',
  },
  sectionDivider: {
    alignItems: 'center',
    width: 200,
  },
  sectionHeaderText: {
    ...fontStyles.label,
    marginTop: 16,
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
  },
  cancelButton: {
    color: colors.dark,
  },
  details: {
    ...fontStyles.small,
    color: colors.gray4,
    paddingTop: 16,
    paddingRight: 16,
  },
})
