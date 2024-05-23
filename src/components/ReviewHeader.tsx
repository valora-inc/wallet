import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'

interface Props {
  title: string
  subtitle?: string
}

class ReviewHeader extends React.PureComponent<Props> {
  render() {
    const { title, subtitle } = this.props
    return (
      <View style={styles.container}>
        <Text style={[fontStyles.h1, styles.heading]}>{title}</Text>
        {!!subtitle && subtitle.length > 0 && <Text style={fontStyles.regular}>{subtitle}</Text>}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  heading: {
    padding: 10,
    paddingBottom: 10, // overwrite h1
    color: colors.black,
    alignSelf: 'center',
  },
})

export default ReviewHeader
