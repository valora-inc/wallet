import { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import Animated, { Extrapolation, interpolate } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import SegmentedControl from 'src/components/SegmentedControl'
import BackChevron from 'src/icons/BackChevron'
import Share from 'src/icons/Share'
import Times from 'src/icons/Times'
import { TopBarIconButton } from 'src/navigator/TopBarButton'
import { useDispatch } from 'src/redux/hooks'
import { shareQRCode, SVG } from 'src/send/actions'
import colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

type Props = MaterialTopTabBarProps & {
  qrSvgRef: React.MutableRefObject<SVG>
  leftIcon: 'times' | 'back'
  canSwitch: boolean
}

export default function QRTabBar({
  state,
  descriptors,
  navigation,
  qrSvgRef,
  leftIcon = 'times',
  canSwitch = true,
}: Props) {
  const dispatch = useDispatch()
  const { t } = useTranslation()
  const values = useMemo(
    () =>
      state.routes.map((route) => {
        const { options } = descriptors[route.key]
        const label = options.title !== undefined ? options.title : route.name
        return label
      }),
    [state, descriptors]
  )

  const color = state.index === 0 ? colors.black : colors.white
  const shareOpacity = interpolate(state.index, [0, 0.1], [1, 0], Extrapolation.CLAMP)

  const onPressClose = () => {
    navigation.getParent()?.goBack()
  }

  const onPressShare = () => {
    dispatch(shareQRCode(qrSvgRef.current))
  }

  const getParams = (route: string) => {
    return state.routes.find((data) => data.name === route)?.params ?? {}
  }

  const onChange = (value: string, index: number) => {
    const route = state.routes[index]
    const isFocused = index === state.index

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    })

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, getParams(route.name))
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.leftContainer}>
        <TopBarIconButton
          icon={leftIcon === 'times' ? <Times color={color} /> : <BackChevron color={color} />}
          onPress={onPressClose}
        />
      </View>
      {canSwitch ? (
        <SegmentedControl values={values} selectedIndex={state.index} onChange={onChange} />
      ) : (
        <View style={styles.headerTitleContainer}>
          <Text
            testID="HeaderTitle"
            style={{
              ...styles.headerTitle,
              color: state.index === 0 ? colors.black : colors.white,
            }}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {state.index === 0 ? t('walletAddress') : t('scanCode')}
          </Text>
        </View>
      )}
      <Animated.View
        style={[styles.rightContainer, { opacity: shareOpacity }]}
        pointerEvents={state.index > 0 ? 'none' : undefined}
      >
        <TopBarIconButton icon={<Share color={colors.black} />} onPress={onPressShare} />
      </Animated.View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftContainer: {
    width: 50,
    alignItems: 'center',
  },
  rightContainer: {
    width: 50,
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  headerTitle: {
    ...typeScale.labelSemiBoldMedium,
    maxWidth: Dimensions.get('window').width * 0.6,
  },
})
