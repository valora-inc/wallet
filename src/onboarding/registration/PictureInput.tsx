import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, StyleSheet, View } from 'react-native'
import ImagePicker from 'react-native-image-crop-picker'
import { currentUserRecipientSelector } from 'src/account/selectors'
import ContactCircle from 'src/components/ContactCircle'
import OptionsChooser from 'src/components/OptionsChooser'
import Touchable from 'src/components/Touchable'
import Edit from 'src/icons/Edit'
import { Recipient } from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
import colors from 'src/styles/colors'
import Logger from 'src/utils/Logger'
import { ensureError } from 'src/utils/ensureError'
import { getDataURL } from 'src/utils/image'

const PICTURE_SIZE = 64

interface Props {
  picture: string | null
  onPhotoChosen: (dataUrl: string | null) => void
}

function PictureInput({ picture, onPhotoChosen }: Props) {
  const [showOptions, setShowOptions] = useState(false)
  const updateShowOptions = (show: boolean) => () => setShowOptions(show)

  const { t } = useTranslation()

  const pickPhoto = async (pickerFunction: typeof ImagePicker.openPicker) => {
    try {
      const image = await pickerFunction({
        width: 150,
        height: 150,
        cropping: true,
        includeBase64: true,
        cropperCircleOverlay: true,
        cropperChooseText: t('choose') ?? undefined,
        cropperCancelText: t('cancel') ?? undefined,
      })
      if (image) {
        // @ts-ignore
        onPhotoChosen(getDataURL(image.mime, image.data))
      }
    } catch (err) {
      const error = ensureError(err)
      const MISSING_PERMISSION_ERR_MSG = 'Required permission missing'
      const USER_CANCELLED_ERR_MSG = 'User cancelled image selection'
      if (
        error.message.includes(USER_CANCELLED_ERR_MSG) ||
        error.message.includes(MISSING_PERMISSION_ERR_MSG)
      ) {
        Logger.info('PictureInput', error.message)
        return
      }

      Logger.error('PictureInput', 'Error while fetching image from picker', error)
    }
  }

  const onOptionChosen = async (buttonIndex: number) => {
    setShowOptions(false)
    // Give time for the modal to close when using Android or the
    // picker/camera will close instantly.
    setTimeout(
      async () => {
        if (buttonIndex === 0) {
          await pickPhoto(ImagePicker.openPicker)
        } else if (buttonIndex === 1) {
          await pickPhoto(ImagePicker.openCamera)
        } else if (buttonIndex === 2) {
          onPhotoChosen(null)
        }
      },
      Platform.OS === 'android' ? 500 : 0
    )
  }

  const recipient: Recipient = {
    ...useSelector(currentUserRecipientSelector),
    thumbnailPath: picture || undefined,
  }

  const showRemoveOption = !!picture
  return (
    <>
      <Touchable
        style={[styles.container]}
        onPress={updateShowOptions(true)}
        testID={'PictureInput'}
      >
        <>
          <ContactCircle size={PICTURE_SIZE} recipient={recipient} />
          <View style={styles.editIconContainer}>
            <Edit />
          </View>
        </>
      </Touchable>
      <OptionsChooser
        isVisible={showOptions}
        options={[
          t('chooseFromLibrary'),
          t('takePhoto'),
          showRemoveOption ? t('removePhoto') : '',
        ].filter((option) => option.length > 0)}
        includeCancelButton={true}
        isLastOptionDestructive={showRemoveOption}
        onOptionChosen={onOptionChosen}
        onCancel={updateShowOptions(false)}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    width: PICTURE_SIZE,
    height: PICTURE_SIZE,
    borderRadius: PICTURE_SIZE / 2,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    width: 40,
    height: 40,
    position: 'absolute',
    left: 37,
    bottom: -13,
    borderRadius: 20,
    backgroundColor: colors.gray1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default PictureInput
