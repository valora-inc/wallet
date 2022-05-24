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
        text={!asset ? t('swap.select') : asset.symbol}
        type={BtnTypes.PRIMARY}
      />
    </Fragment>
  )
}

export default TokenSelectionButton
