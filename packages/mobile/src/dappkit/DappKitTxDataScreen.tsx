import { StackScreenProps } from '@react-navigation/stack'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

type Props = WithTranslation & StackScreenProps<StackParamList, Screens.DappKitTxDataScreen>

class DappKitTxDataScreen extends React.Component<Props> {
  static navigationOptions = headerWithBackButton

  render() {
    const dappKitData = this.props.route.params.dappKitData

    const { t } = this.props
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.header}>{t('data')}</Text>
          <Text testID="Dapp-Data" style={styles.bodyText}>
            {dappKitData}
          </Text>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    marginHorizontal: Spacing.Regular16,
  },
  header: {
    ...fontStyles.h1,
    textAlign: 'left',
    paddingBottom: 15,
  },
  bodyText: {
    ...fontStyles.small,
    color: colors.gray4,
  },
})

export default withTranslation<Props>()(DappKitTxDataScreen)
