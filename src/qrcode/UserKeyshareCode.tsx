import { RouteProp } from '@react-navigation/native'
import React, { useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showError } from 'src/alert/actions'
import { KeyshareEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { KeyshareType } from 'src/backup/mpc/hooks'
import BackButton from 'src/components/BackButton'
import i18n from 'src/i18n'
import { emptyHeader } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import QRCode from 'src/qrcode/QRGen'
import { urlFromKeyshareData } from 'src/qrcode/schema'
import { SVG } from 'src/send/actions'
import colors, { Colors } from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import Logger from 'src/utils/Logger'
import VerificationCountdown from 'src/verify/VerificationCountdown'
import { SESSION_TIMEOUT, useCapsule } from 'src/web3/hooks'

interface Props {
  content?: string
  qrSvgRef: React.MutableRefObject<SVG>
}

const KEYSHARE_RETRIES = 3
const KEYSHARE_SECRET_RETRY_TIME = 5000

export default function UserKeyshareDisplay({ content, qrSvgRef }: Props) {
  const dispatch = useDispatch()
  const { encryptAndShareSecret, userKeyshareSecret } = useCapsule()
  const [startTime, setStartTime] = useState<number>(Date.now())

  const { result: capsule } = useAsync(async () => await encryptAndShareSecret(), [])

  useEffect(() => {
    if (userKeyshareSecret) return
    let retries = 0
    const interval = setInterval(async () => {
      await capsule?.refreshSecret()
      if (userKeyshareSecret) {
        clearInterval(interval)
      } else if (retries >= KEYSHARE_RETRIES) {
        clearInterval(interval)
        dispatch(showError(ErrorMessages.CAPSULE_KEYSHARE_ENCRYPTION_FAILED, 1000))
      }
      setStartTime(Date.now())
      retries++
    }, KEYSHARE_SECRET_RETRY_TIME)

    return () => {
      clearInterval(interval)
    }
  }, [userKeyshareSecret])

  const qrContent = useMemo(
    () =>
      urlFromKeyshareData(
        {
          secret: userKeyshareSecret,
        },
        KeyshareType.User
      ),
    [userKeyshareSecret]
  )

  const refreshKeyshareSecret = async () => {
    ValoraAnalytics.track(KeyshareEvents.export_user_keyshare_timeout)
    await capsule?.refreshSecret()
    setStartTime(Date.now())
  }

  Logger.debug('Keyshare', qrContent)

  return (
    <SafeAreaView style={styles.container}>
      {userKeyshareSecret && (
        <QRCode value={content ?? qrContent} size={(variables.width * 2) / 3} svgRef={qrSvgRef} />
      )}
      {startTime && userKeyshareSecret && (
        // @note Modify the sizing of the timer pls
        <VerificationCountdown
          onFinish={refreshKeyshareSecret}
          startTime={startTime}
          duration={SESSION_TIMEOUT}
          shouldRepeat
        />
      )}
      <Text style={styles.instructions}>
        Every 5 minutes, we will generate a new code for you to use.
      </Text>
    </SafeAreaView>
  )
}

UserKeyshareDisplay.navigationOptions = ({
  route,
}: {
  route: RouteProp<StackParamList, Screens.UserKeyshareCode>
}) => {
  return {
    ...emptyHeader,
    headerLeft: () => <BackButton eventName={KeyshareEvents.export_user_keyshare_cancel} />,
    headerTitle: i18n.t('userKeyshare'),
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    backgroundColor: colors.light,
    paddingHorizontal: variables.contentPadding,
  },
  instructions: {
    ...fontStyles.label,
    color: Colors.dark,
    textAlign: 'center',
    paddingHorizontal: variables.contentPadding * 2,
  },
})
