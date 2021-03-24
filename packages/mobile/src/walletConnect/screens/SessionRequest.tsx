import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import ListItem from '@celo/react-components/components/ListItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { navigate, navigateClearingStack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { acceptSession, denySession } from 'src/walletConnect/actions'
import { selectPendingSession } from 'src/walletConnect/selectors'
import { humanReadableAction, SupportedActions } from '../constants'

const TAG = 'WalletConnect/RequestScreen'

function deduplicateArray(array: any[]) {
  return [...new Set(array)]
}

function ActionList({ actions }: { actions: string[] }) {
  const descriptions = deduplicateArray(
    actions.map((a) => humanReadableAction(a as SupportedActions)).filter(Boolean)
  )

  return (
    <View>
      {descriptions.map((d) => (
        <ListItem key={d}>
          <Text>{d}</Text>
        </ListItem>
      ))}
    </View>
  )
}

type RouteProps = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>
type Props = RouteProps

export default function WalletConnectRequestScreen(props: Props) {
  const session = useSelector(selectPendingSession)
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()

  if (!session) {
    return null
  }

  const confirm = () => {
    dispatch(acceptSession(session))
    navigateClearingStack(Screens.WalletConnectSessions)
  }

  const deny = () => {
    dispatch(denySession(session))
    navigateClearingStack(Screens.WalletConnectSessions)
  }

  const icon = session.proposer.metadata.icons[0] || `${session.proposer.metadata.url}/favicon.ico`
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <View style={{ display: 'flex', alignItems: 'center' }}>
            <Image
              style={{ height: 40, width: 40, marginBottom: 12, marginHorizontal: 'auto' }}
              source={{ uri: icon }}
              height={40}
              width={40}
            />
          </View>
          <Text style={styles.header}>
            {t('connectToWallet', { dappName: session.proposer.metadata.name })}
          </Text>
          <Text style={styles.share}>{t('sessionInfo')}</Text>
        </View>

        <View style={[styles.content, { paddingTop: 12 }]}>
          <ActionList actions={session.permissions.jsonrpc.methods} />
        </View>

        <View style={styles.actionContainer}>
          <Button
            style={styles.button}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.MEDIUM}
            text={t('cancel')}
            onPress={deny}
          />
          <Button
            style={styles.button}
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={confirm}
          />
        </View>

        <View style={[styles.content, { paddingTop: 40 }]}>
          <TouchableOpacity onPress={() => navigate(Screens.Support)}>
            <Text style={styles.share}>{t('moreInfo')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 30,
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
  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
})
