import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetProps } from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import { ScrollView } from 'react-native-gesture-handler'
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomSheetScrollView from 'src/components/BottomSheetScrollView'
import Touchable from 'src/components/Touchable'
import Checkmark from 'src/icons/Checkmark'
import Colors from 'src/styles/colors'
import { typeScale } from 'src/styles/fonts'

const ITEM_HEIGHT = 60
const MAX_ITEMS_IN_VIEW = 5

interface MultiSelectBottomSheetProps<T extends string> {
  forwardedRef: React.RefObject<GorhomBottomSheet>
  onChange?: BottomSheetProps['onChange']
  onClose?: () => void
  onOpen?: () => void
  handleComponent?: BottomSheetProps['handleComponent']
  selectedItems: Record<T, boolean>
  setSelectedItems: (selectedItems: Record<T, boolean>) => void
  textAndIconMap: Record<T, Omit<ItemProps, 'onPress' | 'isSelected'>>
  selectAllText: string
  title: string
}

function MultiSelectBottomSheet<T extends string>({
  forwardedRef,
  onClose,
  onOpen,
  selectedItems,
  setSelectedItems,
  textAndIconMap,
  selectAllText,
  title,
}: MultiSelectBottomSheetProps<T>) {
  const { t } = useTranslation()

  // Bottom Sheet Things
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

  // Multi select logic things
  const isEveryItemSelected = Object.values(selectedItems).every((isSelected) => isSelected)
  const allItemIds = Object.keys(selectedItems) as T[]
  const everyItemSelected = useMemo(
    () =>
      allItemIds.reduce(
        (acc, key) => {
          acc[key as T] = true
          return acc
        },
        {} as Record<T, boolean>
      ),
    [allItemIds]
  )
  const noItemSelected = useMemo(
    () =>
      allItemIds.reduce(
        (acc, key) => {
          acc[key as T] = false
          return acc
        },
        {} as Record<T, boolean>
      ),
    [allItemIds]
  )

  const selectAllItem = renderItem({
    text: selectAllText,
    isSelected: isEveryItemSelected,
    onPress: () => setSelectedItems(everyItemSelected),
  })

  const items = (Object.entries(selectedItems) as [T, boolean][]).map(([itemId, isSelected]) =>
    renderItem({
      text: textAndIconMap[itemId].text,
      iconUrl: textAndIconMap[itemId].iconUrl,
      isSelected: isSelected && !isEveryItemSelected,
      onPress: () => {
        if (isEveryItemSelected) {
          setSelectedItems({ ...noItemSelected, [itemId]: isSelected })
        } else {
          setSelectedItems({ ...selectedItems, [itemId]: !isSelected })
        }
      },
    })
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
        containerStyle={styles.bottomSheetScrollView}
      >
        <View style={[styles.item, styles.borderRadiusTop]}>
          <Text style={styles.boldTextStyle}>{title}</Text>
        </View>
        <View style={styles.itemsContainer}>
          <ScrollView style={{ height: ITEM_HEIGHT * MAX_ITEMS_IN_VIEW }}>
            {selectAllItem}
            {items}
          </ScrollView>
        </View>
        <View style={styles.doneButtonContainer}>
          <Touchable
            testID="MultiSelectBottomSheet/Done"
            style={styles.doneButton}
            onPress={handleClose}
          >
            <Text style={styles.boldTextStyle}>{t('done')}</Text>
          </Touchable>
        </View>
      </BottomSheetScrollView>
    </GorhomBottomSheet>
  )
}

export interface ItemProps {
  onPress?: () => void
  text: string
  isSelected: boolean
  iconUrl?: string
}
function renderItem({ onPress, text, iconUrl, isSelected }: ItemProps) {
  return (
    <View key={text} style={styles.itemContainer}>
      <Touchable style={styles.item} onPress={onPress}>
        <View style={styles.itemRow}>
          <View style={styles.leftColumn}>
            <FastImage source={{ uri: iconUrl }} style={styles.icon} testID={`${text}-icon`} />
          </View>
          <View style={styles.centerColumn}>
            <Text numberOfLines={1} style={styles.textStyle}>
              {text}
            </Text>
          </View>
          <View style={styles.rightColumn}>
            <View style={styles.checkMarkContainer}>
              {isSelected && (
                <Checkmark
                  testID={`${text}-checkmark`}
                  color={Colors.black}
                  height={24}
                  width={24}
                />
              )}
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
  icon: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  leftColumn: {
    alignItems: 'flex-start',
    width: 32,
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  rightColumn: {
    width: 32,
    alignItems: 'flex-end',
  },
  checkMarkContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
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
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  boldTextStyle: {
    ...typeScale.labelSemiBoldLarge,
  },
  bottomSheetScrollView: {
    marginHorizontal: 16,
    padding: 0,
  },
})

export default MultiSelectBottomSheet
