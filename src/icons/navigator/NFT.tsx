import * as React from 'react'
import Svg, { Path } from 'react-native-svg'

export function NFT() {
  return (
    <Svg width={32} height={32} fill="none">
      <Path
        fill="#B4B9BD"
        d="M10.945 10.45v10.99H8.68l-4.416-7.367v7.367H2V10.45h2.264l4.424 7.375V10.45h2.257ZM15.257 10.45v10.99h-2.265V10.45h2.264Zm4.377 4.695v1.767h-4.997v-1.767h4.997Zm.529-4.695v1.774h-5.526V10.45h5.526ZM26.618 10.45v10.99h-2.256V10.45h2.256Zm3.382 0v1.774h-8.967V10.45H30Z"
      />
    </Svg>
  )
}

export default React.memo(NFT)
