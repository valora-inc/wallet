import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useDispatch } from 'react-redux'
import Dialog from 'src/components/Dialog'
import InfoIcon from 'src/icons/InfoIcon'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { setSwapAsset } from 'src/swap/actions'
import { SwapDirection } from 'src/swap/types'
import { UbeswapExprimentalToken } from 'src/tokens/reducer'

type OwnProps = {
  token: UbeswapExprimentalToken | undefined
  direction: SwapDirection
  onClick: () => void
}

type Props = OwnProps
const TokenListItem = ({ token, direction, onClick }: Props) => {
  const dispatch = useDispatch()
  const [showDialog, setShowDialog] = React.useState(false)
  const { address, name, symbol, logoURI } = token || {}

  const handleClick = () => {
    dispatch(setSwapAsset(token!, direction))
    onClick()
  }

  return (
    <TouchableOpacity style={styles.row} onPress={handleClick}>
      <View style={styles.left}>
        <Image source={{ uri: logoURI }} style={styles.tokenIcon} />
      </View>
      <View style={styles.center}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={() => setShowDialog(true)} hitSlop={variables.iconHitslop}>
          <InfoIcon size={17} color={Colors.gray3} />
        </TouchableOpacity>
      </View>
      <Dialog
        title={name}
        isVisible={showDialog}
        actionText={'Close'}
        actionPress={() => setShowDialog(false)}
        isActionHighlighted={false}
        onBackgroundPress={() => setShowDialog(false)}
        children={<Text>This contract is located at {address}</Text>}
      />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 12,
  },
  left: {
    flexDirection: 'column',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  center: {
    flexGrow: 1,
    borderBottomColor: Colors.gray2,
    paddingBottom: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxWidth: '65%',
  },
  right: {
    paddingHorizontal: 30,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  name: {
    ...fontStyles.regular,
  },
  symbol: {
    ...fontStyles.small,
    color: Colors.gray5,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
})

export default TokenListItem
