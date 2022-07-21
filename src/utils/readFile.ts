import * as RNFS from 'react-native-fs'
import Logger from 'src/utils/Logger'

/**
 * Reads and returns a portion of the input file.
 */
const readChunk = async (file: string, length: number, position: number) => {
  try {
    return await RNFS.read(file, length, position, 'utf8')
  } catch (error) {
    Logger.error('readFile@readChunk', 'readChunk error', error)
    return ''
  }
}

/**
 * Reads the logs in chunks to a string and returns the string.
 * [Credits]{@link: https://stackoverflow.com/a/56284734}
 */
export const readFileChunked = async (rnLogsSrc = Logger.getReactNativeLogFilePath()) => {
  const length = 4096
  let chunk = ''
  let fileContents = ''
  if (await RNFS.exists(rnLogsSrc)) {
    do {
      chunk = await readChunk(rnLogsSrc, length, fileContents.length)
      fileContents += chunk
    } while (chunk.length > 0)
  }
  return fileContents
}
