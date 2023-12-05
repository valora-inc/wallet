import React from 'react'
import { View } from 'react-native'
import { shallowEqual, useSelector } from 'react-redux'
import { nameSelector } from 'src/account/selectors'
import StyledQRCode from 'src/qrcode/StyledQRGen'
import { useQRContent } from 'src/qrcode/utils'
import { RootState } from 'src/redux/reducers'
import { SVG } from 'src/send/actions'
import variables from 'src/styles/variables'
import { currentAccountSelector } from 'src/web3/selectors'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
}

export const mapStateToProps = (state: RootState) => ({
  address: currentAccountSelector(state)!,
  displayName: nameSelector(state) || undefined,
  e164PhoneNumber: state.account.e164PhoneNumber || undefined,
})

export default function StyledQRCodeDisplay({ qrSvgRef }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useQRContent(data)

  return (
    <View testID="styledQRCode">
      <StyledQRCode value={qrContent} size={variables.width / 2} svgRef={qrSvgRef} />
    </View>
  )
}
