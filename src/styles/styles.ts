import { StyleSheet } from 'react-native'

const BASE_UNIT = 8

export enum Spacing {
  Tiny4 = BASE_UNIT / 2,
  Smallest8 = BASE_UNIT,
  Small12 = BASE_UNIT * 1.5,
  Regular16 = BASE_UNIT * 2,
  Thick24 = BASE_UNIT * 3,
  Large32 = BASE_UNIT * 4,
  XLarge48 = BASE_UNIT * 6,
}

export enum Shadow {
  Soft = 'Soft',
  SoftLight = 'SoftLight',
  BarShadow = 'BarShadow',
}

export function getShadowStyle(shadow: Shadow) {
  switch (shadow) {
    case Shadow.Soft:
      return styles.softShadow
    case Shadow.SoftLight:
      return styles.softShadowLight
    case Shadow.BarShadow:
      return styles.barShadow
  }
}

export function elevationShadowStyle(elevation: number) {
  return {
    elevation,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 0.5 * elevation },
    shadowOpacity: 0.3,
    shadowRadius: 0.8 * elevation,
  }
}

const styles = StyleSheet.create({
  softShadow: {
    elevation: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    shadowOpacity: 1,
    shadowColor: 'rgba(156, 164, 169, 0.4)',
  },
  softShadowLight: {
    elevation: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    shadowOpacity: 1,
    shadowColor: 'rgba(48, 46, 37, 0.15)',
  },
  barShadow: {
    elevation: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 1.5,
    shadowColor: 'rgba(129, 134, 139, 0.5)',
  },
})

export default styles
