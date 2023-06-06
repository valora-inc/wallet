import BottomSheet, {
  BottomSheetBackdrop,
  useBottomSheetDynamicSnapPoints,
} from '@gorhom/bottom-sheet'
import { BottomSheetDefaultBackdropProps } from '@gorhom/bottom-sheet/lib/typescript/components/bottomSheetBackdrop/types'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch } from 'react-redux'
import Touchable from 'src/components/Touchable'
import SaveCircle from 'src/icons/SaveCircle'
import ShareCircle from 'src/icons/ShareCircle'
import { saveNft, shareNft } from 'src/nfts/actions'
import { Nft } from 'src/nfts/types'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { Spacing } from 'src/styles/styles'

const useNftShareBottomSheet = ({ nft }: { nft: Nft }) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const dispatch = useDispatch()
  const paddingBottom = Math.max(insets.bottom, Spacing.Thick24)
  const bottomSheetRef = useRef<BottomSheet>(null)

  // TODO: Move to a saga and dispatch a toast on success or failure
  // Instead of simply closing the sheet
  const handleShareAction = () => {
    dispatch(shareNft(nft))
    closeSheet()
  }

  const handleSaveAction = () => {
    dispatch(saveNft(nft))
    closeSheet()
  }

  const initialSnapPoints = useMemo(() => ['CONTENT_HEIGHT'], [])
  const { animatedHandleHeight, animatedSnapPoints, animatedContentHeight, handleContentLayout } =
    useBottomSheetDynamicSnapPoints(initialSnapPoints)

  // TODO: add analytics for opening the Nft bottom sheet
  const openSheet = () => {
    bottomSheetRef.current?.snapToIndex(0)
  }

  // TODO: fix the bottom sheet not closing on Android on press of the backdrop
  const closeSheet = () => {
    bottomSheetRef.current?.close()
  }

  const renderBackdrop = useCallback(
    (props: JSX.IntrinsicAttributes & BottomSheetDefaultBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    []
  )

  const NftShareBottomSheet = useMemo(
    () => (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handle}
      >
        <View
          style={[styles.container, { paddingBottom }]}
          onLayout={handleContentLayout}
          testID="nfts/NftBottomSheet"
        >
          <View style={styles.touchableViewContainer}>
            <Touchable onPress={handleShareAction}>
              <View style={styles.touchableView}>
                <ShareCircle />
                <Text style={styles.touchableViewText}>{t('nftBottomSheet.share')}</Text>
              </View>
            </Touchable>
          </View>
          <View style={styles.gap} />
          <View style={styles.touchableViewContainer}>
            <Touchable onPress={handleSaveAction}>
              <View style={styles.touchableView}>
                <SaveCircle />
                <Text style={styles.touchableViewText}>{t('nftBottomSheet.save')}</Text>
              </View>
            </Touchable>
          </View>
        </View>
      </BottomSheet>
    ),
    [
      animatedSnapPoints,
      animatedHandleHeight,
      animatedContentHeight,
      handleContentLayout,
      `${nft.contractAddress}-${nft.tokenId}`,
    ]
  )

  return {
    openSheet,
    NftShareBottomSheet,
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.Thick24,
    paddingVertical: Spacing.Regular16,
    gap: Spacing.Regular16,
    flex: 1,
  },
  description: {
    ...fontStyles.small,
    marginBottom: Spacing.Large32,
  },
  handle: {
    backgroundColor: colors.gray3,
  },
  gap: {
    height: Spacing.Thick24,
  },
  title: {
    ...fontStyles.h2,
    marginBottom: Spacing.Regular16,
  },
  touchableView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  touchableViewContainer: {
    borderRadius: 100,
    overflow: 'hidden',
  },
  touchableViewText: {
    marginLeft: Spacing.Regular16,
  },
})

export default useNftShareBottomSheet
