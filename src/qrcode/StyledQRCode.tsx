import React from 'react'
import { View } from 'react-native'
import { shallowEqual, useSelector } from 'react-redux'
import { mapStateToProps } from 'src/qrcode/QRCode'
import StyledQRCode from 'src/qrcode/StyledQRGen'
import { useQRContent } from 'src/qrcode/utils'
import { SVG } from 'src/send/actions'
import variables from 'src/styles/variables'
import { QRCodeDataType } from 'src/statsig/types'

interface Props {
  qrSvgRef: React.MutableRefObject<SVG>
  dataType: QRCodeDataType
}

export default function StyledQRCodeDisplay({ qrSvgRef, dataType }: Props) {
  const data = useSelector(mapStateToProps, shallowEqual)
  const qrContent = useQRContent(dataType, data)

  return (
    <View testID="styledQRCode">
      <StyledQRCode value={qrContent} size={variables.width / 2} svgRef={qrSvgRef} />
    </View>
  )
}
