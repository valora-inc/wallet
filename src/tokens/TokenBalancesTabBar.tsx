import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import SegmentedControl from 'src/components/SegmentedControl'
import colors from 'src/styles/colors'
import { Screens } from 'src/navigator/Screens'
import { walletAddressSelector } from 'src/web3/selectors'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { HomeEvents } from 'src/analytics/Events'
import variables from 'src/styles/variables'

type Props = MaterialTopTabBarProps

export default function TokenbalancesTabBar({ state, descriptors, navigation, position }: Props) {
  const walletAddress = useSelector(walletAddressSelector)

  const values = useMemo(
    () =>
      state.routes.map((route) => {
        const { options } = descriptors[route.key]
        const label = options.title !== undefined ? options.title : route.name
        return label
      }),
    [state, descriptors]
  )

  const onChange = (value: string, index: number) => {
    const route = state.routes[index]
    const isFocused = index === state.index

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })

    if (!isFocused && !event.defaultPrevented) {
      if (index === 1) {
        ValoraAnalytics.track(HomeEvents.view_nft_home_assets)
        navigation.navigate(Screens.WebViewScreen, {
          uri: `https://nfts.valoraapp.com/?address=${walletAddress}&hide-header=true`,
        })
      }
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <SegmentedControl
        values={values}
        selectedIndex={state.index}
        position={position}
        onChange={onChange}
        colorRange={[colors.gray5, colors.gray5]}
        invertedColorRange={[colors.light, colors.light]}
        containerStyle={{ marginHorizontal: variables.contentPadding }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
})
