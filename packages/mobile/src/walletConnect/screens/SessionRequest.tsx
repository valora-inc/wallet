import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import { Namespaces } from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { StackParamList } from 'src/navigator/types'
import { acceptSession, denySession } from 'src/walletConnect/actions'
import { getTranslationDescriptionFromAction, SupportedActions } from 'src/walletConnect/constants'
import { selectSessions } from 'src/walletConnect/selectors'

function deduplicateArray<T>(array: T[]) {
  return [...new Set(array)]
}

function ActionList({ actions }: { actions: string[] }) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const descriptions = deduplicateArray(
    actions.map((a) => getTranslationDescriptionFromAction(a as SupportedActions))
  )

  return (
    <View>
      {descriptions.map((d) => (
        <Text key={d} style={styles.actionItem}>
          {t(d)}
        </Text>
      ))}
    </View>
  )
}

type Props = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>
function SessionRequest({
  route: {
    params: { session },
  },
}: Props) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()

  const confirm = () => {
    dispatch(acceptSession(session))
    navigateBack()
  }

  const deny = () => {
    dispatch(denySession(session))
    navigateBack()
  }

  const icon = session.proposer.metadata.icons[0] || `${session.proposer.metadata.url}/favicon.ico`
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <View style={styles.center}>
            <Image style={styles.logo} source={{ uri: icon }} />
          </View>
          <Text style={styles.header}>
            {t('connectToWallet', { dappName: session.proposer.metadata.name })}
          </Text>
          <Text style={styles.subHeader}>{t('sessionInfo')}</Text>
        </View>

        <View style={styles.content}>
          <ActionList actions={session.permissions.jsonrpc.methods} />
        </View>

        <View style={styles.actionContainer}>
          <Button
            style={styles.cancelButton}
            type={BtnTypes.SECONDARY}
            size={BtnSizes.MEDIUM}
            text={t('cancel')}
            onPress={deny}
          />
          <Button
            type={BtnTypes.PRIMARY}
            size={BtnSizes.MEDIUM}
            text={t('allow')}
            onPress={confirm}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function LeftHeader() {
  const dispatch = useDispatch()
  const { pending } = useSelector(selectSessions)

  const deny = () => {
    dispatch(denySession(pending[0]))
    navigateBack()
  }

  return <TopBarIconButton icon={<Times />} onPress={deny} />
}

SessionRequest.navigationOptions = () => {
  return {
    ...emptyHeader,
    headerLeft: LeftHeader,
    headerLeftContainerStyle: { paddingLeft: 20 },
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    marginHorizontal: 24,
  },
  scrollContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: 80,
    width: 80,
  },
  center: { display: 'flex', alignItems: 'center' },
  header: {
    ...fontStyles.h1,
    textAlign: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  subHeader: {
    ...fontStyles.regular,
    color: colors.gray5,
    textAlign: 'center',
  },
  content: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  actionItem: {
    ...fontStyles.regular,
    color: colors.gray5,
    paddingBottom: 8,
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  cancelButton: { marginRight: 8 },
})

export default SessionRequest
