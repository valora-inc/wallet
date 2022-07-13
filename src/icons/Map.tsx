import * as React from 'react'
import Svg, { G, Path } from 'react-native-svg'
import Colors from 'src/styles/colors'

const Map = ({ size = 24, color = Colors.dark as string }) => {
  const width = Math.floor((95 / 107) * size)
  return (
    <Svg width={width} height={size} viewBox="0 0 95 107">
      <G id="Kolektivo" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <G id="Artboard" transform="translate(-1115.000000, -88.000000)" fill-rule="nonzero">
          <G id="map" transform="translate(1115.287937, 88.295764)">
            <Path
              d="M46.9660184,100.416711 L22.8328763,73.8446376 C9.99923543,59.7140097 10.3666287,38.0396772 23.6718049,24.3521182 C36.3801516,11.2785414 57.2805302,10.9824638 70.354107,23.6908105 C70.5776544,23.9081128 70.7981125,24.1285708 71.0154148,24.3521182 C84.3484798,38.0683675 84.8001762,59.7612533 72.0496287,74.0206242 L48.4517262,100.410961 C48.0835912,100.822659 47.4514119,100.857974 47.039714,100.489839 C47.0138992,100.466755 46.9893008,100.442347 46.9660184,100.416711 Z"
              id="Path-3"
              stroke={color}
              strokeWidth={10}
            ></Path>
            <Path
              d="M47.7120627,58.7042365 C42.2120627,58.7042365 37.7120627,54.2042365 37.7120627,48.7042365 C37.7120627,43.2042365 42.2120627,38.7042365 47.7120627,38.7042365 C53.2120627,38.7042365 57.7120627,43.2042365 57.7120627,48.7042365 C57.7120627,54.2042365 53.2120627,58.7042365 47.7120627,58.7042365 Z"
              id="Path"
              fill={color}
              strokeWidth={10}
            ></Path>
          </G>
        </G>
      </G>
    </Svg>
  )
}

export default Map
