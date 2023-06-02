import { CameraRoll } from '@react-native-camera-roll/camera-roll'
import { PermissionsAndroid, Platform } from 'react-native'
import * as RNFS from 'react-native-fs'
import Logger from 'src/utils/Logger'

const mimeTypeToExtension: { [key: string]: string | undefined } = {
  'image/png': 'png',
  'image/x-png': 'png',
  'image/jpeg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/jpg': 'jpg', // image/jpg is technically not a mime type, but handling it just in case.
}

export const extensionToMimeType: { [key: string]: string | undefined } = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
}

export const getDataURL = (mime: string, data: any) => `data:${mime};base64,${data}`

// Data URL format: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
export const saveImageDataUrlToFile = async (
  dataUrl: string,
  fileNameWithoutExtension: string
): Promise<string> => {
  const mimeType = dataUrl.split(':')[1].split(',')[0].split(';')[0]
  const extension = mimeTypeToExtension[mimeType] || 'jpg'
  const fileName = `${fileNameWithoutExtension}.${extension}`
  const data = dataUrl.substr(dataUrl.indexOf(',') + 1)
  await RNFS.writeFile(fileName, data, 'base64')
  Logger.info('Image saved successfully')
  return fileName
}

export const saveProfilePicture = async (dataUrl: string): Promise<string> => {
  return saveImageDataUrlToFile(
    dataUrl,
    `file://${RNFS.DocumentDirectoryPath}/profile-${Date.now()}`
  )
}

export const saveRecipientPicture = async (dataUrl: string, address: string): Promise<string> => {
  await RNFS.mkdir(`${RNFS.CachesDirectoryPath}/pictures`)
  return saveImageDataUrlToFile(dataUrl, `file://${RNFS.CachesDirectoryPath}/pictures/${address}`)
}

/***
 * https://github.com/react-native-cameraroll/react-native-cameraroll#usage
 * READ_EXTERNAL_STORAGE is required for Android 10 and below.
 * READ_MEDIA_VIDEO is required for Android 13 and above.
 * @returns {Promise<boolean>} true if the permission is granted, false otherwise.
 */
const hasAndroidPermission = async () => {
  const permission =
    Platform.Version >= 33
      ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO
      : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
  const hasPermission = await PermissionsAndroid.check(permission)
  if (hasPermission) return true
  const status = await PermissionsAndroid.request(permission)
  return status === 'granted'
}

/***
 * Saves an image to the camera roll. 
 * On iOS we can save the image directly, but on Android we need to save it to temp file first.
 * @param url The url of the image to save.
 * @returns {Promise<void>}
 * @throws Error if the image could not be fetched or saved.
 */
export const saveRemoteToCameraRoll = async (url: string): Promise<void> => {
  const { data, mimeType } = await fetchImageAsBase64(url)
  const dataUrl = `data:${mimeType};base64,${data}`
  if (Platform.OS === 'ios') await CameraRoll.save(dataUrl)
  else {
    if (!await hasAndroidPermission()) return
    const tempFile = `${RNFS.DocumentDirectoryPath}/nft-${Date.now()}`
    const fileName = await saveImageDataUrlToFile(dataUrl, tempFile)
    await CameraRoll.save(`file://${fileName}`)
  }
}

/***
 * Fetches an image from the given url and converts it to base64.
 * Gets the mime type from the Content-Type header.
 * @param url The url of the image to fetch.
 * @returns {Promise<{data: string, mimeType: string}>}
 */
export const fetchImageAsBase64 = async (url: string): Promise<{ data: string; mimeType: string }> => {
  const imagePath = `${RNFS.DocumentDirectoryPath}/nft-${Date.now()}`
  try {
    let mimeType = null
    await RNFS.downloadFile({
      fromUrl: url,
      toFile: imagePath,
      begin: (res) => {
        // get mime type from Content-Type
        mimeType = res.headers['Content-Type'].split(';')[0]
      },
    }).promise
    const data = await RNFS.readFile(imagePath, 'base64')
    if (!mimeType) throw new Error('No mime type')
    if (!data) throw new Error('No Image data')
    return {
      data,
      mimeType,
    }
  } catch (error) {
    throw new Error(`Failed to fetch image and convert to base64: ${error.message}`)
  } finally {
    RNFS.unlink(imagePath)
  }
}
