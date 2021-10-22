import Touchable from '@celo/react-components/components/Touchable'
import DownArrowIcon from '@celo/react-components/icons/DownArrowIcon'
import colors from '@celo/react-components/styles/colors'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTokenInfo } from 'src/tokens/hooks'

interface Props {
  tokenAddress: string
  onChangeToken: () => void
}

function TockerPickerSelector({ tokenAddress, onChangeToken }: Props) {
  const tokenInfo = useTokenInfo(tokenAddress)

  return (
    <Touchable style={styles.touchable} onPress={onChangeToken} testID="onChangeToken">
      <View style={styles.container}>
        <Text style={styles.token}>{tokenInfo?.symbol}</Text>
        <DownArrowIcon color={colors.greenUI} />
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  touchable: {},
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    paddingRight: 8,
    borderRadius: 14,
    backgroundColor: colors.lightGreen,
  },
  token: {
    paddingVertical: 8,
    paddingLeft: 8,
    color: colors.greenUI,
  },
})

export default TockerPickerSelector
