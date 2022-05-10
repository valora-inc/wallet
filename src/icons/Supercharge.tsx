import * as React from 'react'
import { G, Path, Svg } from 'react-native-svg'
import colors from 'src/styles/colors'

const Supercharge = () => {
  return (
    <Svg width="9" height="18" viewBox="0 0 9 18" fill="none">
      <G>
        <Path
          d="M0.910005 8.07282L8.24768 0.750725C8.44328 0.555543 8.76973 0.752025 8.68883 1.01624L6.5073 8.14061C6.47289 8.25299 6.51651 8.37462 6.61451 8.43952L8.70575 9.82454C8.85302 9.92207 8.86567 10.1336 8.73106 10.248L0.457965 17.2783C0.24502 17.4593 -0.06692 17.2305 0.041634 16.973L3.0494 9.83827C3.1033 9.71042 3.04961 9.56264 2.92622 9.49921L0.97611 8.49663C0.816044 8.41434 0.782604 8.19995 0.910005 8.07282Z"
          fill={colors.greenUI}
        />
      </G>
    </Svg>
  )
}

export default React.memo(Supercharge)
