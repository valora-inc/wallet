import QRCode from 'react-native-qrcode-svg'
import React from 'react'
import { SVG } from 'src/send/actions'

function StyledQRCode({
  value,
  size = 100,
  svgRef,
}: {
  value: string
  size: number
  svgRef: React.MutableRefObject<SVG>
}) {
  return <QRCode value={value} size={size} getRef={(ref) => (svgRef.current = ref)} />
}

export default React.memo(StyledQRCode)
