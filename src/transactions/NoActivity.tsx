import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { withTranslation } from 'src/i18n'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { FeedType } from 'src/transactions/TransactionFeed'

interface OwnProps {
  kind: FeedType
  loading: boolean
  error: ApolloError | Error | undefined
}

type Props = OwnProps & WithTranslation

export class NoActivity extends React.PureComponent<Props> {
  render() {
    const { kind, loading, error, t } = this.props

    if (error) {
      return (
        <View style={styles.container} testID="NoActivity/error">
          <Text style={styles.text}>{t('errorLoadingActivity.0')}</Text>
          <Text style={styles.text}>{t('errorLoadingActivity.1')}</Text>
        </View>
      )
    }

    const statusText =
      kind === FeedType.EXCHANGE ? t('noExchangeActivity') : t('noTransactionActivity')

    return (
      <View style={styles.container}>
        {loading && (
          <ActivityIndicator
            style={styles.icon}
            size="large"
            color={colors.greenBrand}
            testID="NoActivity/loading"
          />
        )}
        <Text style={styles.text}>{statusText} </Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 32,
  },
  icon: {
    marginVertical: 20,
    height: 108,
    width: 108,
  },
  text: {
    ...fontStyles.regular,
    color: colors.gray3,
  },
})

export default withTranslation<Props>()(NoActivity)
