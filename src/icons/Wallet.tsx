import * as React from 'react'
import Svg, { Ellipse, G, Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const Wallet = ({ size = 24, color = Colors.dark as string }) => {
  const width = Math.floor((86 / 81) * size)
  return (
    <Svg width={width} height={size} viewBox="0 0 86 81">
      <G id="Kolektivo" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <G
          id="Artboard"
          transform="translate(-110.000000, -99.000000)"
          fill={color}
          fill-rule="nonzero"
        >
          <G id="wallet" transform="translate(110.000000, 99.000000)">
            <Path
              d="M81.4736842,19.26 L81.4736842,9 C81.4736842,4.05 77.4,0 72.4210526,0 L9.05263158,0 C4.02842105,0 0,4.05 0,9 L0,72 C0,76.95 4.02842105,81 9.05263158,81 L72.4210526,81 C77.4,81 81.4736842,76.95 81.4736842,72 L81.4736842,61.74 C84.1442105,60.165 86,57.33 86,54 L86,27 C86,23.67 84.1442105,20.835 81.4736842,19.26 Z M76.9473684,27 L76.9473684,54 L45.2631579,54 L45.2631579,27 L76.9473684,27 Z M9.05263158,72 L9.05263158,9 L72.4210526,9 L72.4210526,18 L45.2631579,18 C40.2842105,18 36.2105263,22.05 36.2105263,27 L36.2105263,54 C36.2105263,58.95 40.2842105,63 45.2631579,63 L72.4210526,63 L72.4210526,72 L9.05263158,72 Z"
              id="Shape"
            ></Path>
            <Ellipse id="Oval" cx="58.8421053" cy="40.5" rx="6.78947368" ry="6.75"></Ellipse>
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default Wallet
