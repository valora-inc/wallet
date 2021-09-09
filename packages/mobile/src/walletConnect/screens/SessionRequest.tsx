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
import {
  acceptSession as acceptSessionV1,
  denySession as denySessionV1,
} from 'src/walletConnect/actions-v1'
import {
  acceptSession as acceptSessionV2,
  denySession as denySessionV2,
} from 'src/walletConnect/actions-v2'
import { getTranslationDescriptionFromAction, SupportedActions } from 'src/walletConnect/constants'
import { selectSessions } from 'src/walletConnect/selectors'

function deduplicateArray<T>(array: T[]) {
  return [...new Set(array)]
}

function ActionList({ actions }: { actions: string[] }) {
  const descriptions = deduplicateArray(
    actions.map((a) => getTranslationDescriptionFromAction(a as SupportedActions))
  )

  return (
    <View>
      {descriptions.map((d) => (
        <Text key={d} style={styles.actionItem}>
          {d}
        </Text>
      ))}
    </View>
  )
}

type Props = StackScreenProps<StackParamList, Screens.WalletConnectSessionRequest>
function SessionRequest({ route: { params } }: Props) {
  const { t } = useTranslation(Namespaces.walletConnect)
  const dispatch = useDispatch()

  const confirm = () => {
    dispatch(params.isV1 ? acceptSessionV1(params.session) : acceptSessionV2(params.session))
    navigateBack()
  }

  const deny = () => {
    dispatch(params.isV1 ? denySessionV1(params.session) : denySessionV2(params.session))
    navigateBack()
  }

  console.log(JSON.stringify(params))
  const url = params.isV1
    ? params.session.params[0].peerMeta.url
    : params.session.proposer.metadata.url
  const name = params.isV1
    ? params.session.params[0].peerMeta.name
    : params.session.proposer.metadata.name
  const icon = params.isV1
    ? params.session.params[0].peerMeta.icons[0]
    : params.session.proposer.metadata.icons[0]
  const fallbackIcon = icon ?? `${url}/favicon.ico`

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View>
          <View style={styles.center}>
            <Image style={styles.logo} source={{ uri: fallbackIcon }} />
          </View>
          <Text style={styles.header} testID="SessionRequestHeader">
            {t('connectToWallet', { dappName: name })}
          </Text>
          <Text style={styles.subHeader}>{t('sessionInfo')}</Text>
        </View>

        {!params.isV1 && (
          <View style={styles.content}>
            <ActionList actions={params.session.permissions.jsonrpc.methods} />
          </View>
        )}

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
    const [session] = pending
    dispatch(session.isV1 ? denySessionV1(session.session) : denySessionV2(session.session))
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
