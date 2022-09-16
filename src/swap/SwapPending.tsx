import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { noHeader } from 'src/navigator/Headers'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

export function SwapPending() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.loadingContentContainer}>
        <ActivityIndicator
          size="large"
          color={colors.greenBrand}
          testID="SwapPending/loading"
          style={styles.activityIndicator}
        />
        <Text style={styles.loadingText}>Swap Pending</Text>
        <Text style={styles.loadingSubText}>Your swap is being processed</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  loadingContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.Regular16,
    flexGrow: 1,
  },
  activityIndicator: {
    marginBottom: 30,
  },
  loadingText: {
    ...fontStyles.h2,
    marginBottom: 16,
  },
  loadingSubText: {
    ...fontStyles.regular,
  }
})

SwapPending.navOptions = {
  ...noHeader,
}

export default SwapPending