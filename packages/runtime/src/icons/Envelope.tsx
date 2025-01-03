import * as React from 'react'
import Svg, { Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

interface Props {
  size?: number
  color?: string
}

export function Envelope({ color, size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        fill={color}
        d="m12 1 9.05 5.4c.3.183.533.433.7.75.167.317.25.65.25 1V19c0 .55-.196 1.02-.587 1.413A1.926 1.926 0 0 1 20 21H4c-.55 0-1.02-.196-1.413-.587A1.926 1.926 0 0 1 2 19V8.15c0-.35.083-.683.25-1 .167-.317.4-.567.7-.75L12 1Zm0 11.65L19.8 8 12 3.35 4.2 8l7.8 4.65ZM12 15l-8-4.8V19h16v-8.8L12 15Zm0 4h8H4h8Z"
      />
    </Svg>
  )
}

Envelope.defaultProps = {
  color: Colors.gray3,
  size: 24,
}

export default React.memo(Envelope)
