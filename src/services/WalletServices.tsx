import _ from 'lodash'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { appStateSelector, maxNumRecentDappsSelector } from 'src/app/selectors'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET } from 'src/config'
import Logo from 'src/icons/Logo'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { phoneRecipientCacheSelector } from 'src/recipients/reducer'
import useSelector from 'src/redux/useSelector'
import { CoreServices } from 'src/services/Services'
import { celoAddressSelector, coreTokensSelector } from 'src/tokens/selectors'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

const numColumns = 3
const threeColumnList = {
  numColumns: numColumns,
}

function WalletServices() {
  const { t } = useTranslation()

  const appState = useSelector(appStateSelector)
  const isLoading = useSelector((state) => state.home.loading)
  const recipientCache = useSelector(phoneRecipientCacheSelector)
  const isNumberVerified = useSelector((state) => state.app.numberVerified)
  const maxNumRecentDapps = useSelector(maxNumRecentDappsSelector)
  const coreTokenBalances = useSelector(coreTokensSelector)
  const celoAddress = useSelector(celoAddressSelector)
  const cashInButtonExpEnabled = useSelector((state) => state.app.cashInButtonExpEnabled)

  const scrollPosition = useRef(new Animated.Value(0)).current
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollPosition } } }])

  const dispatch = useDispatch()

  const showTestnetBanner = () => {
    dispatch(
      showMessage(
        t('testnetAlert.1', { testnet: _.startCase(DEFAULT_TESTNET) }),
        ALERT_BANNER_DURATION,
        null,
        null,
        t('testnetAlert.0', { testnet: _.startCase(DEFAULT_TESTNET) })
      )
    )
  }

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const flatKeyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const renderFlatListItem = ({ item, index }: any) => {
    return (
      <View style={styles.flexRow}>
        <TouchableOpacity onPress={() => navigate(Screens.WalletHome)}>
          <View style={[styles.row]}>
            <Logo height={50} />
          </View>
          <Text>{t(item.title)}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const sections = []
  // @todo Core services section; a list of services the user uses
  // @todo Pending services section; a list of services not yet implemented
  // @note Each section is a FlatList. This is because SectionList doesnt support
  // multiple columns.
  // @note The section list is a list of two flat lists. Makes sense?
  const walletSection = CoreServices
  // const businessSection = WalletServices;

  sections.push({
    data: [{}],
    renderItem: () => (
      <FlatList
        style={styles.container}
        key={'Services/WalletServices'}
        data={walletSection}
        keyExtractor={flatKeyExtractor}
        renderItem={renderFlatListItem}
        {...threeColumnList}
      />
    ),
  })

  // sections.push({
  //   data: [{}],
  //   renderItem: () => <FlatList key={'Services/BusinessServices'} data={BusinessServices} keyExtractor={flatKeyExtractor} renderItem={renderFlatListItem}/>,
  // })

  return (
    <SafeAreaView style={styles.container}>
      <DrawerTopBar middleElement={<Logo />} scrollPosition={scrollPosition} />
      <AnimatedSectionList
        scrollEventThrottle={16}
        onScroll={onScroll}
        refreshing={isLoading}
        style={styles.container}
        sections={sections}
        keyExtractor={keyExtractor}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  flexRow: {
    // backgroundColor: 'blue',
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
    justifyContent: 'space-around',
    flexGrow: 1,
    marginVertical: 30,
  },
  row: {
    // backgroundColor: 'red',
    justifyContent: 'space-around',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    flexGrow: 1,
    marginVertical: 10,
  },
})

export default WalletServices
