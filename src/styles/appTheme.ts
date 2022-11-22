// Global app them used by react-navigation
import { DefaultTheme } from '@react-navigation/native'
import colors from 'src/styles/colors'

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.light,
  },
}

export default appTheme
