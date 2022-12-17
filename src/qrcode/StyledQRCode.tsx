import React, { useMemo } from 'react'
import StyledQRCode from 'src/qrcode/StyledQRGen'
import { shallowEqual, useSelector } from 'react-redux'
import { mapStateToProps } from 'src/qrcode/QRCode'
import { urlFromUriData } from 'src/qrcode/schema'
import { SVG } from 'src/send/actions'
import { View } from 'react-native'
import variables from 'src/styles/variables'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
}

export default function StyledQRCodeDisplay({ qrSvgRef }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useMemo(
    () => urlFromUriData(data),
    [data.address, data.displayName, data.e164PhoneNumber]
  )
  return (
    <View testID="styledQRCode">
      <StyledQRCode value={qrContent} size={variables.width / 2} svgRef={qrSvgRef} />
    </View>
  )
}
