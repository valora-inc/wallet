import { RouteProp } from '@react-navigation/native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import FullscreenCTA from 'src/components/FullscreenCTA'
import { withTranslation } from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { RESTART_APP_I18N_KEY, restartApp } from 'src/utils/AppRestart'

interface OwnProps {
  errorMessage?: string
  route?: RouteProp<StackParamList, Screens.ErrorScreen>
}

type Props = OwnProps & WithTranslation

class ErrorScreen extends React.Component<Props> {
  static navigationOptions = { header: null }

  getErrorMessage = () => {
    return this.props.errorMessage || this.props.route?.params.errorMessage || 'unknown'
  }

  render() {
    const { t } = this.props
    const errorMessage = this.getErrorMessage()
    return (
      <FullscreenCTA
        CTAText={t(RESTART_APP_I18N_KEY)}
        CTAHandler={restartApp}
        title={t('oops')}
        subtitle={t('somethingWrong')}
      >
        <View>
          <Text style={styles.errorMessage} numberOfLines={10} ellipsizeMode="tail">
            {t(errorMessage)}
          </Text>
        </View>
      </FullscreenCTA>
    )
  }
}

const styles = StyleSheet.create({
  errorMessage: {
    ...typeScale.bodyMedium,
    fontSize: 12,
    borderRadius: 25,
    backgroundColor: Colors.gray1,
    padding: 15,
  },
})

export default withTranslation<Props>()(ErrorScreen)
