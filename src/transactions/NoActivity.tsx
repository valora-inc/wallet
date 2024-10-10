import { type SerializedError } from '@reduxjs/toolkit'
import { type FetchBaseQueryError } from '@reduxjs/toolkit/query'
import * as React from 'react'
import { type WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { withTranslation } from 'src/i18n'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
interface OwnProps {
  loading: boolean
  error: Error | FetchBaseQueryError | SerializedError | undefined
}

type Props = OwnProps & WithTranslation

export class NoActivity extends React.PureComponent<Props> {
  render() {
    const { loading, error, t } = this.props

    if (error) {
      return (
        <View style={styles.container} testID="NoActivity/error">
          <Text style={styles.text}>{t('errorLoadingActivity.0')}</Text>
          <Text style={styles.text}>{t('errorLoadingActivity.1')}</Text>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        {loading && (
          <ActivityIndicator
            style={styles.icon}
            size="large"
            color={colors.primary}
            testID="NoActivity/loading"
          />
        )}
        <Text style={styles.text}>{t('noTransactionActivity')} </Text>
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
    ...typeScale.bodyLarge,
    color: colors.gray3,
  },
})

export default withTranslation<Props>()(NoActivity)
