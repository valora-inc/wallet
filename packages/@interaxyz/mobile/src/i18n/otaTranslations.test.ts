import * as RNFS from 'react-native-fs'
import { OTA_TRANSLATIONS_FILEPATH } from 'src/config'
import { getOtaTranslations, saveOtaTranslations } from 'src/i18n/otaTranslations'

const translation = { de: { someKey: 'someValue' } }
const stringTranslation = '{"de":{"someKey":"someValue"}}'

describe('otaTranslations utils', () => {
  it('should save the translations', async () => {
    const writeToFileSpy = jest.spyOn(RNFS, 'writeFile')

    await saveOtaTranslations(translation)

    expect(writeToFileSpy).toHaveBeenCalledTimes(1)
    expect(writeToFileSpy).toHaveBeenCalledWith(OTA_TRANSLATIONS_FILEPATH, stringTranslation)
  })

  it('should return the cached translations when present', async () => {
    jest.spyOn(RNFS, 'exists').mockResolvedValueOnce(true)
    jest.spyOn(RNFS, 'readFile').mockResolvedValueOnce(stringTranslation)

    const result = await getOtaTranslations()

    expect(result).toEqual(translation)
  })

  it('should return no cached translations when not present', async () => {
    jest.spyOn(RNFS, 'exists').mockResolvedValueOnce(false)

    const result = await getOtaTranslations()

    expect(result).toEqual({})
  })
})
