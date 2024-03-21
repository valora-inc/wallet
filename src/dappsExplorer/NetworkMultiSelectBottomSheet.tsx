import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetProps } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useRef } from 'react'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Touchable from 'src/components/Touchable'
import Checkmark from 'src/icons/Checkmark'
import { useSelector } from 'src/redux/hooks'
import { NETWORK_NAMES } from 'src/shared/conts'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'
import { networksIconSelector } from 'src/tokens/selectors'
import { NetworkId } from 'src/transactions/types'

const ITEM_HEIGHT = 60

interface Props {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  onChange?: BottomSheetProps['onChange']
  onClose?: () => void
  onOpen?: () => void
  handleComponent?: BottomSheetProps['handleComponent']
  selectedNetworkIds: Record<NetworkId, boolean>
  setSelectedNetworkIds: (selectedNetworkIds: Record<NetworkId, boolean>) => void
}

function NetworkMultiSelectBottomSheet({
  forwardedRef,
  onClose,
  onOpen,
  selectedNetworkIds,
  setSelectedNetworkIds,
}: Props) {
  const scrollViewRef = useRef<ScrollView>(null)
  const { height } = useSafeAreaFrame()
  const insets = useSafeAreaInsets()
  const renderBackdrop = useCallback(
    (props: BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  // fires before bottom sheet animation starts
  const handleAnimate = (fromIndex: number, toIndex: number) => {
    if (toIndex === -1 || fromIndex === -1) {
      // ensure that the keyboard dismiss animation starts at the same time as
      // the bottom sheet
      Keyboard.dismiss()
    }

    if (toIndex === 0) {
      onOpen?.()
    }
  }

  const handleClose = () => {
    onClose?.()
  }

  const networkIconByNetworkId = useSelector((state) =>
    networksIconSelector(state, Object.keys(selectedNetworkIds) as NetworkId[])
  )
  const everyNetworkIsSelected = Object.values(selectedNetworkIds).every((isSelected) => isSelected)
  const everyNetworkSelected = Object.keys(selectedNetworkIds).reduce(
    (acc, networkId) => {
      acc[networkId as NetworkId] = true
      return acc
    },
    {} as Record<NetworkId, boolean>
  )
  const noNetworkSelected = Object.keys(selectedNetworkIds).reduce(
    (acc, networkId) => {
      acc[networkId as NetworkId] = false
      return acc
    },
    {} as Record<NetworkId, boolean>
  )

  return (
    <GorhomBottomSheet
      ref={forwardedRef}
      index={-1}
      enableDynamicSizing={true}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ width: 0 }}
      onAnimate={handleAnimate}
      onClose={handleClose}
      maxDynamicContentSize={height - insets.top}
      backgroundStyle={{ backgroundColor: 'transparent' }}
    >
      <BottomSheetScrollView
        forwardedRef={scrollViewRef}
        testId={'MultiSelectBottomSheet'}
        containerStyle={styles.container}
      >
        <View style={[styles.item, styles.borderRadiusTop]}>
          <Text style={styles.buttonStyle}>Switch Network</Text>
        </View>
        <View style={styles.itemsContainer}>
          <ScrollView style={{ height: ITEM_HEIGHT * 5 }}>
            {renderItem({
              text: 'All Networks',
              isSelected: everyNetworkIsSelected,
              onPress: () => setSelectedNetworkIds(everyNetworkSelected),
            })}
            {Object.entries(selectedNetworkIds).map(([networkId, isSelected], index) => {
              return renderItem({
                text: NETWORK_NAMES[networkId as NetworkId],
                isSelected: isSelected && !everyNetworkIsSelected,
                iconUrl: networkIconByNetworkId[networkId as NetworkId],
                onPress: () => {
                  if (everyNetworkIsSelected) {
                    setSelectedNetworkIds({ ...noNetworkSelected, [networkId]: isSelected })
                  } else {
                    setSelectedNetworkIds({ ...selectedNetworkIds, [networkId]: !isSelected })
                  }
                },
              })
            })}
          </ScrollView>
        </View>
        <View style={styles.doneButtonContainer}>
          <Touchable style={styles.doneButton} onPress={handleClose}>
            <Text style={styles.buttonStyle}> Done</Text>
          </Touchable>
        </View>
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  )
}

interface ItemProps {
  onPress?: () => void
  text: string
  isSelected: boolean
  iconUrl?: string
}
function renderItem({ onPress, text, iconUrl, isSelected }: ItemProps) {
  return (
    <View key={text} style={styles.itemContainer}>
      <Touchable style={styles.item} onPress={onPress}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'flex-start' }}>
            <FastImage
              source={{ uri: iconUrl }}
              style={[
                {
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                },
              ]}
            />
          </View>
          <View style={{ flex: 4, alignItems: 'center' }}>
            <Text numberOfLines={1} style={styles.textStyle}>
              {' '}
              {text}
            </Text>
          </View>
          <View style={{ width: 32, alignItems: 'flex-end' }}>
            <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center' }}>
              {isSelected && <Checkmark color={Colors.black} height={24} width={24} />}
            </View>
          </View>
        </View>
      </Touchable>
    </View>
  )
}

const styles = StyleSheet.create({
  doneButton: {
    borderRadius: 16,
    backgroundColor: Colors.white,
    height: 56,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 24,
  },
  doneButtonContainer: {
    flexDirection: 'column',
  },
  itemContainer: {
    flexDirection: 'column',
  },
  item: {
    height: ITEM_HEIGHT,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderColor: Colors.gray2,
  },
  borderRadiusTop: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: Colors.white,
  },
  itemsContainer: {
    flexDirection: 'column',
    marginBottom: 8,
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  textStyle: {
    ...typeScale.bodyLarge,
  },
  buttonStyle: {
    ...typeScale.labelSemiBoldLarge,
  },
  container: {
    marginHorizontal: 16,
    padding: 0,
  },
})

export default NetworkMultiSelectBottomSheet
