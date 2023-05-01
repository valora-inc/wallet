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
      <View style={styles.searchTextContainer}>
        <Text style={styles.text}>
          <Trans i18nKey="dappsScreen.emptyResults.searchMessage" tOptions={{ searchTerm }}>
            <Text style={styles.searchedText} />
          </Trans>
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  /* Using a 1:11 flex on two elements will create a pseudo 12 column layout */
  iconContainer: {
    marginRight: Spacing.Smallest8,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchedText: {
    color: Colors.dark,
    fontWeight: 'bold',
  },
  text: {
    ...fontStyles.xsmall,
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  viewContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: Spacing.Thick24,
  },
})

export default NoResults
