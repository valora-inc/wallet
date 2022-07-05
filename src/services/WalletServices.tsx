import _ from 'lodash'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { SectionList, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { FlatGrid } from 'react-native-super-grid'
import { useDispatch } from 'react-redux'
import { showMessage } from 'src/alert/actions'
import { ALERT_BANNER_DURATION, DEFAULT_TESTNET } from 'src/config'
import Logo from 'src/icons/Logo'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigate } from 'src/navigator/NavigationService'
import useSelector from 'src/redux/useSelector'
import { CoreServices } from 'src/services/Services'
import fontStyles from 'src/styles/fonts'

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList)

const numColumns = 3

function WalletServices() {
  const { t } = useTranslation()

  const isLoading = useSelector((state) => state.home.loading)

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

  showTestnetBanner()

  const keyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const flatKeyExtractor = (_item: any, index: number) => {
    return index.toString()
  }

  const renderFlatListItem = ({ item, index }: any) => {
    return (
      <View style={styles.tile}>
        <TouchableOpacity onPress={() => navigate(item.screen)}>
          <View style={styles.icon}>
            <item.icon height={30} />
          </View>
          <Text style={[styles.textcenter, styles.title]}>{t(item.title)}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const sections = []
  const walletSection = CoreServices

  sections.push({
    data: [{}],
    renderItem: () => (
      <FlatGrid
        style={[styles.container]}
        key={'Services/WalletServices'}
        data={walletSection}
        itemDimension={90}
        keyExtractor={flatKeyExtractor}
        renderItem={renderFlatListItem}
        maxItemsPerRow={numColumns}
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
    backgroundColor: '#fff',
  },
  icon: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 'auto',
  },
  textcenter: {
    textAlign: 'center',
  },
  title: {
    paddingTop: 10,
    ...fontStyles.regular,
  },
  tile: {
    marginVertical: 30,
  },
})

export default WalletServices
