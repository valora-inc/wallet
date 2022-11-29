import { DefaultTheme } from '@react-navigation/native'
import colors from 'src/styles/colors'

// Global app theme used by react-navigation
const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.light,
  },
}

export default appTheme
