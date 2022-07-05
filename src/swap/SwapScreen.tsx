import React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import i18n, { withTranslation } from 'src/i18n'
import { HeaderTitleWithSubtitle, headerWithBackButton } from 'src/navigator/Headers'
import useSelector from 'src/redux/useSelector'
import variables from 'src/styles/variables'
import ExchangeModal from 'src/swap/ExchangeModal'
import { fetchSelectedSwapAssets } from 'src/swap/reducer'

type Props = WithTranslation

function SwapScreen({ t }: Props) {
  const { currentAssetIn, currentAssetOut } = useSelector(fetchSelectedSwapAssets)

  return (
    <View style={styles.container} testID={'Swap/Main'}>
      <ExchangeModal
        defaultInputAsset={currentAssetIn}
        defaultOutputAsset={currentAssetOut}
        type={'Swap'}
      />
    </View>
  )
}

SwapScreen.navigationOptions = () => {
  return {
    ...headerWithBackButton,
    headerTitle: () => <HeaderTitleWithSubtitle title={i18n.t('swap.title')} />,
  }
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: variables.contentPadding,
    marginVertical: 16,
  },
})

export default withTranslation<Props>()(SwapScreen)
