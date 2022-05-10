import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SendEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import Touchable from 'src/components/Touchable'
import DownArrowIcon from 'src/icons/DownArrowIcon'
import colors from 'src/styles/colors'
import { useTokenInfo } from 'src/tokens/hooks'

interface Props {
  tokenAddress: string
  onChangeToken: () => void
}

function TokenPickerSelector({ tokenAddress, onChangeToken }: Props) {
  const tokenInfo = useTokenInfo(tokenAddress)

  const onButtonPressed = () => {
    onChangeToken()
    ValoraAnalytics.track(SendEvents.token_dropdown_opened, {
      currentTokenAddress: tokenAddress,
    })
  }

  return (
    <Touchable style={styles.touchable} onPress={onButtonPressed} testID="onChangeToken">
      <View style={styles.container}>
        <Text allowFontScaling={false} style={styles.token}>
          {tokenInfo?.symbol}
        </Text>
        <DownArrowIcon height={16} color={colors.greenUI} />
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

export default TokenPickerSelector
