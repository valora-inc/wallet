import React from 'react'
import { Trans } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import InfoIcon from 'src/icons/InfoIcon'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

interface Props {
  searchTerm: string
  testID?: string
}

function NoResults({ testID, searchTerm }: Props) {
  return (
    <View testID={testID} style={styles.viewContainer}>
      <View style={styles.iconContainer}>
        <InfoIcon color={Colors.onboardingBlue} />
      </View>
      <Text style={styles.text}>
        <Trans i18nKey="dappsScreen.emptyResults.searchMessage" tOptions={{ searchTerm }}>
          <Text style={styles.searchedText} />
        </Trans>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  iconContainer: {
    flex: 1,
  },
  searchedText: {
    color: Colors.dark,
    fontWeight: 'bold',
  },
  text: {
    ...fontStyles.xsmall,
    flex: 10,
    textAlignVertical: 'center',
  },
  viewContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.Thick24,
    marginTop: Spacing.Thick24,
  },
})

export default NoResults
