import Touchable from '@celo/react-components/components/Touchable'
import { Colors } from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { Spacing } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native'
import { recentDappsSelector } from 'src/app/selectors'
import { Dapp } from 'src/app/types'
import ProgressArrow from 'src/icons/ProgressArrow'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import useSelector from 'src/redux/useSelector'

interface Props {
  onSelectDapp(dapp: Dapp): void
}

const DAPP_ICON_SIZE = 68

function RecentlyUsedDapps({ onSelectDapp }: Props) {
  const recentlyUsedDapps = useSelector(recentDappsSelector)
  const { t } = useTranslation()

  const onPressAllDapps = () => {
    navigate(Screens.DAppsExplorerScreen)
  }

  if (!recentlyUsedDapps.length) {
    return null
  }

  return (
    <View style={styles.body} testID="RecentlyUsedDappsContainer">
      <View style={[styles.titleContainer, styles.row]}>
        <Text style={styles.title}>{t('recentlyUsedDapps')}</Text>
        <Touchable style={styles.row} onPress={onPressAllDapps} testID="AllDapps">
          <>
            <Text style={styles.allDapps}>{t('allDapps')}</Text>
            <ProgressArrow color={Colors.greenUI} />
          </>
        </Touchable>
      </View>

      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        testID="RecentlyUsedDapps/ScrollContainer"
      >
        {recentlyUsedDapps.map((recentlyUsedDapp, index) => (
          <Touchable
            key={recentlyUsedDapp.id}
            onPress={() => onSelectDapp(recentlyUsedDapp)}
            style={styles.dappContainer}
            testID={`RecentDapp${index}`}
          >
            <>
              <Image
                source={{ uri: recentlyUsedDapp.iconUrl }}
                style={styles.icon}
                resizeMode="cover"
                testID={`RecentDapp${index}-icon`}
              />
              <Text style={styles.dappName} numberOfLines={1} ellipsizeMode="tail">
                {recentlyUsedDapp.name}
              </Text>
            </>
          </Touchable>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  body: {
    maxWidth: variables.width,
    width: variables.width,
    paddingTop: Spacing.Regular16,
    paddingBottom: Spacing.Thick24,
  },
  titleContainer: {
    paddingHorizontal: Spacing.Regular16,
    paddingBottom: Spacing.Regular16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    ...fontStyles.sectionHeader,
    color: Colors.gray4,
  },
  allDapps: {
    ...fontStyles.label,
    color: Colors.greenUI,
    marginRight: Spacing.Smallest8,
  },
  dappContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.Regular16,
  },
  dappName: {
    ...fontStyles.small,
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    maxWidth: DAPP_ICON_SIZE,
  },
  icon: {
    height: DAPP_ICON_SIZE,
    width: DAPP_ICON_SIZE,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: Colors.gray2,
    marginBottom: Spacing.Small12,
  },
})

export default RecentlyUsedDapps
