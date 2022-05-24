import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import Dialog from 'src/components/Dialog'
import InfoIcon from 'src/icons/InfoIcon'
import Colors from 'src/styles/colors'
import fontStyles from 'src/styles/fonts'
import variables from 'src/styles/variables'
import { StoredTokenBalance } from 'src/tokens/reducer'

type OwnProps = {
  token: StoredTokenBalance | undefined
  onClick: (payload: string) => void
}

type Props = OwnProps
const TokenListItem = ({ token, onClick }: Props) => {
  const [showDialog, setShowDialog] = React.useState(false)
  const { address, name, symbol, imageUrl } = token || {}
  return (
    <TouchableOpacity style={styles.row} onPress={() => onClick(address || '')}>
      <View style={styles.left}>
        <Text>$</Text>
      </View>
      <View style={styles.center}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.symbol}>{symbol}</Text>
      </View>
      <View style={styles.right}>
        <TouchableOpacity onPress={() => setShowDialog(true)} hitSlop={variables.iconHitslop}>
          <InfoIcon size={15} color={Colors.gray3} />
        </TouchableOpacity>
      </View>
      <Dialog
        title={name}
        isVisible={showDialog}
        actionText={'Close'}
        actionPress={() => setShowDialog(false)}
        isActionHighlighted={false}
        onBackgroundPress={() => setShowDialog(false)}
      >
        <Text>This contract is located at {address}</Text>
      </Dialog>
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
  },
  right: {
    paddingHorizontal: 5,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  name: {
    ...fontStyles.regular,
  },
  symbol: {
    ...fontStyles.small500,
    color: Colors.gray5,
  },
})

export default TokenListItem
