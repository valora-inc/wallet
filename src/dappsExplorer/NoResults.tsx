import React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSelector } from 'react-redux'
import Touchable from 'src/components/Touchable'
import { currentLanguageSelector } from 'src/i18n/selectors'
import InfoIcon from 'src/icons/InfoIcon'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'
import { iconHitslop } from 'src/styles/variables'

interface Props {
  filterId: string
  filterName: string
  removeFilter: () => void
  searchTerm: string
  testID?: string
}

function NoResults({ filterId, filterName, removeFilter, testID, searchTerm }: Props) {
  const { t } = useTranslation()
  const language = useSelector(currentLanguageSelector)

  const onPress = () => {
    removeFilter()
  }

  return (
    <View testID={testID}>
      {searchTerm !== '' && (
        <View style={styles.searchContainer}>
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
      )}
      {filterId !== 'all' && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterAppliedText}>
            <Trans
              i18nKey={'dappsScreen.emptyResults.message'}
              tOptions={{ filter: filterName?.toLocaleUpperCase(language ?? 'en-US') }}
            >
              <Text style={styles.filterText} />
            </Trans>
          </Text>
          <View style={styles.removeFilterTouchableContainer}>
            <Touchable
              hitSlop={iconHitslop}
              onPress={onPress}
              style={styles.removeFilterTouchable}
              testID={`${testID}/RemoveFilter`}
            >
              <Text style={styles.removeFilterText}>
                {t('dappsScreen.emptyResults.removeFilter')}
              </Text>
            </Touchable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchedText: {
    color: Colors.dark,
    fontWeight: 'bold',
  },
  text: {
    ...fontStyles.xsmall,
    textAlignVertical: 'center',
    flexWrap: 'wrap',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    marginTop: Spacing.Thick24,
  },
  iconContainer: {
    marginRight: Spacing.Smallest8,
  },
  searchTextContainer: {
    flex: 1,
  },
  filterContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.Regular16,
  },
  filterText: {
    ...fontStyles.small500,
    color: Colors.onboardingBlue,
  },
  filterAppliedText: {
    ...fontStyles.small500,
    color: Colors.gray5,
    paddingRight: 4,
  },
  removeFilterTouchableContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  removeFilterTouchable: {
    paddingVertical: 0,
    paddingHorizontal: Spacing.Smallest8,
    backgroundColor: Colors.gray2,
    borderRadius: 16,
  },
  removeFilterText: {
    ...fontStyles.small500,
    color: Colors.onboardingBlue,
  },
})

export default NoResults
