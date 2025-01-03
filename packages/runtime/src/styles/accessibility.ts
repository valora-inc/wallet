import { PixelRatio } from 'react-native'

export function getSizing(maxSize: number = 38, baseSize: number = 16) {
  return baseSize * PixelRatio.getFontScale() < maxSize
    ? baseSize * PixelRatio.getFontScale()
    : maxSize
}
