import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Button, { BtnSizes, BtnTypes } from 'src/components/Button'
import colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import { StoredTokenBalance } from 'src/tokens/reducer'

type Props = {
  token: StoredTokenBalance
}

function SwapToken({ token }: Props) {
  // @todo Get the icon/img for the token
  const key = Object.keys(token)[0]
  const placeholder = '$'

  return (
    <View style={styles.container}>
      <Text style={styles.input}>{0}</Text>
      <Button
        style={[styles.button]}
        size={BtnSizes.TINY}
        type={BtnTypes.PRIMARY2}
        text={placeholder}
        onPress={() => {}}
        disabled={false}
        testID="SendOrRequestButtons/RequestButton"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'red',
    borderColor: 'green',
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    flexGrow: 1,
    backgroundColor: 'blue',
    ...fontStyles.largeNumber,
  },
  selectToken: {
    backgroundColor: 'pink',
  },
  button: {
    flexDirection: 'column',
  },
  title: {
    ...fontStyles.h2,
    marginBottom: 8,
  },
  balance: {
    ...fontStyles.mediumNumber,
    color: colors.dark,
    marginBottom: 8,
  },
  localBalance: {
    ...fontStyles.regular,
    color: colors.gray4,
  },
})

export default SwapToken
