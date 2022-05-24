import React, { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import Button, { BtnTypes } from 'src/components/Button'

type OwnProps = {
  asset: any
}

type Props = OwnProps

const TokenSelectionButton = ({ asset }: Props) => {
  const { t } = useTranslation()
  const openSwapTokenList = () => {
    // navigate(Screens.SwapTokenList);
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
