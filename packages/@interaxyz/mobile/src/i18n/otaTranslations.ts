import { Resource } from 'i18next'
import * as RNFS from 'react-native-fs'
import { OTA_TRANSLATIONS_FILEPATH } from 'src/config'

export function saveOtaTranslations(resource: Resource) {
  return RNFS.writeFile(OTA_TRANSLATIONS_FILEPATH, JSON.stringify(resource))
}

export async function getOtaTranslations() {
  let cachedTranslations: Resource = {}
  if (await RNFS.exists(OTA_TRANSLATIONS_FILEPATH)) {
    cachedTranslations = JSON.parse(await RNFS.readFile(OTA_TRANSLATIONS_FILEPATH))
  }
  return cachedTranslations
}
