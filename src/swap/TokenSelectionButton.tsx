import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import Button, { BtnTypes } from 'src/components/Button'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { SwapDirection } from 'src/swap/types'

type OwnProps = {
  asset: any
  direction: SwapDirection
}

type Props = OwnProps

const TokenSelectionButton = ({ asset, direction }: Props) => {
  const { t } = useTranslation()
  const openSwapTokenList = () => {
    navigate(Screens.SwapTokenList, { direction })
  }

  return (
    <Fragment>
      <Button
        onPress={openSwapTokenList}
        type={direction === SwapDirection.IN ? BtnTypes.BRAND_PRIMARY : BtnTypes.BRAND_SECONDARY}
        text={!asset ? t('swap.select') : asset.symbol}
      />
    </Fragment>
  )
}

export default TokenSelectionButton
