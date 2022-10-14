import * as React from 'react'
import { LatLng, Marker } from 'react-native-maps'
import { Circle } from 'react-native-svg'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export interface Props {
  color?: string
  size?: number
  coordinate: LatLng
  title?: string
  description?: string
  onPress?: () => void
}

function VendorMarker({ color = colors.inactiveVendor, size = 32, ...props }: Props) {
  const width = (size * 2) / 3
  return (
    <Marker {...props}>
      <Svg
        width={width}
        height={size}
        viewBox="0 0 39 52"
        fill="none"
        xmlns="http://www.w3.org/2000/Svg"
      >
        <Path
          d="M0 19.9212C0 27.6816 2.6933 29.8487 17.2031 50.9646C18.1552 52.3453 20.1919 52.3454 21.1441 50.9646C35.654 29.8487 38.3473 27.6816 38.3473 19.9212C38.3473 9.29114 29.763 0.673828 19.1736 0.673828C8.5843 0.673828 0 9.29114 0 19.9212Z"
          fill="#2AA6A1"
        />
        <Circle cx="19.4691" cy="19.5526" r="11.7992" fill="white" />
        <Path
          d="M25.3013 15.2919H23.9811L24.1968 13.9483L19.7856 13.2403L19.5285 14.8414L18.139 12.4731L15.0941 14.2596L15.6997 15.2919H13.9896L13.5703 26.3235H25.7204L25.3013 15.2919ZM18.075 16.0884H21.2157V17.5266C21.2157 18.3925 20.5112 19.0968 19.6453 19.0968C18.7794 19.0968 18.075 18.3925 18.075 17.5266V16.0884ZM14.3977 25.5272L14.7564 16.0885H17.2786V17.5267C17.2786 18.8318 18.3404 19.8935 19.6453 19.8935C20.9503 19.8935 22.0121 18.8316 22.0121 17.5267V16.0884H24.5343L24.893 25.527H14.3977V25.5272Z"
          fill="#2AA6A1"
        />
      </Svg>
    </Marker>
  )
}

export default VendorMarker
