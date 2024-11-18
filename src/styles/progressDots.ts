import { StyleSheet } from 'react-native'
import colors from 'src/styles/colors'

const CIRCLE_SIZE = 5

const circle = {
  flex: 0,
  height: CIRCLE_SIZE,
  width: CIRCLE_SIZE,
  borderRadius: CIRCLE_SIZE,
  marginHorizontal: 3,
}

export default StyleSheet.create({
  circlePassive: {
    ...circle,
    backgroundColor: colors.gray2,
  },
  circleActive: {
    ...circle,
    backgroundColor: colors.accent,
  },
})
