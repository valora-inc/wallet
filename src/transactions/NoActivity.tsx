import { type SerializedError } from '@reduxjs/toolkit'
import { type FetchBaseQueryError } from '@reduxjs/toolkit/query'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import Celebration from 'src/images/Celebration'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
interface Props {
  loading?: boolean
  error?: Error | FetchBaseQueryError | SerializedError | undefined
}

function NoActivity({ loading, error }: Props) {
  const { t } = useTranslation()

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
      <View style={styles.noTransactionsContainer}>
        <Celebration testID="NoActivity/CelebrationImage" />
        <Text style={styles.noTransactionsText}>{t('transactionFeed.noTransactions')}</Text>
      </View>
      {loading && (
        <ActivityIndicator
          style={styles.icon}
          size="large"
          color={colors.accent}
          testID="NoActivity/loading"
        />
      )}
    </View>
  )
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
  noTransactionsContainer: {
    padding: Spacing.Regular16,
    gap: Spacing.Regular16,
    alignItems: 'center',
  },
  noTransactionsText: {
    ...typeScale.labelSemiBoldMedium,
    textAlign: 'center',
  },
})

export default NoActivity
