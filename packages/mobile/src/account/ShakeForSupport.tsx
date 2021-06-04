import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Touchable from '@celo/react-components/components/Touchable'
import Times from '@celo/react-components/icons/Times'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { StyleSheet, Text } from 'react-native'
import Modal from 'react-native-modal'
import { SafeAreaView } from 'react-native-safe-area-context'
import RNShake from 'react-native-shake'
import { AppState } from 'src/app/actions'
import { getAppState } from 'src/app/selectors'
import i18n from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useTypedSelector from 'src/redux/useSelector'
import Logger from 'src/utils/Logger'

export default function ShakeForSupport() {
  const appState = useTypedSelector(getAppState)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (appState !== AppState.Active) {
      // Don't listen to the shake event if the app is not in the foreground
      return
    }
    RNShake.addEventListener('ShakeEvent', () => {
      Logger.info('NavigatorWrapper', 'Shake Event')
      // TODO: Cancel all modals before this
      setIsVisible(true)
    })
    return () => {
      RNShake.removeEventListener('ShakeEvent')
    }
  }, [appState])

  const onCancelSupport = () => {
    setIsVisible(false)
  }

  const onContactSupport = () => {
    setIsVisible(false)
    navigate(Screens.SupportContact)
  }

  return (
    <Modal isVisible={isVisible} backdropOpacity={0.5} style={styles.modal}>
      <SafeAreaView style={styles.shakeForSupport}>
        <Touchable
          style={styles.closeButton}
          onPress={onCancelSupport}
          borderless={true}
          hitSlop={variables.iconHitslop}
        >
          <Times />
        </Touchable>
        <Text style={styles.supportTitle}>{i18n.t('accountScreen10:havingTrouble')}</Text>
        <Text style={styles.supportSubtitle}>{i18n.t('accountScreen10:shakeForSupport')}</Text>
        <Button
          onPress={onContactSupport}
          text={i18n.t('accountScreen10:contactSupport')}
          type={BtnTypes.PRIMARY}
          testID="ContactSupportFromShake"
        />
      </SafeAreaView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modal: {
    margin: 0,
  },
  shakeForSupport: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.light,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  closeButton: {
    alignSelf: 'flex-end',
    margin: 2,
  },
  supportTitle: {
    ...fontStyles.h2,
    marginTop: 16,
  },
  supportSubtitle: {
    ...fontStyles.regular,
    marginTop: 8,
    marginBottom: 16,
    textAlign: 'center',
  },
})
