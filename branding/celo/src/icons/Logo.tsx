import * as React from 'react'
import { ViewStyle } from 'react-native'
import colors from 'src/styles/colors'
import Svg, { Path } from 'svgs'

export enum LogoTypes {
  COLOR = 'COLOR',
  DARK = 'DARK',
  LIGHT = 'LIGHT',
  GREEN = 'GREEN',
}

interface Props {
  height?: number
  type?: LogoTypes
  style?: ViewStyle
}

export default function Logo({ style, height = 25, type = LogoTypes.COLOR }: Props) {
  let mainColor = 'none'
  switch (type) {
    case LogoTypes.DARK:
      mainColor = colors.dark
      break
    case LogoTypes.LIGHT:
      mainColor = colors.light
      break
    default:
      break
  }

  return (
    <Svg width={height} height={height} viewBox="0 0 171 171" fill={mainColor}>
      <Path
        d="M121.121 8.14463L85.3815 43.884V60.8231L132.009 14.1953C128.547 11.9246 124.909 9.89942 121.121 8.14463Z"
        fill={mainColor == 'none' ? `#547980` : mainColor}
      />
      <Path
        d="M108.421 3.45621L85.3815 26.4955V9.55639L94.1862 0.751709C99.0649 1.253 103.822 2.16629 108.421 3.45621Z"
        fill={mainColor == 'none' ? `#594F4F` : mainColor}
      />
      <Path
        d="M141.86 21.7332L85.3815 78.2116V92.6535L141.86 149.132C144.85 146.48 147.651 143.62 150.242 140.575L95.0996 85.4326L150.242 30.2902C147.651 27.2457 144.849 24.3858 141.86 21.7332Z"
        fill={mainColor == 'none' ? `#45ADA8` : mainColor}
      />
      <Path
        d="M157.594 40.3265L112.488 85.4326L157.594 130.539C159.805 127.008 161.763 123.303 163.445 119.45L129.427 85.4326L163.444 51.4155C161.763 47.5622 159.804 43.8575 157.594 40.3265Z"
        fill={mainColor == 'none' ? `#86E09C` : mainColor}
      />
      <Path
        d="M167.885 64.3631L146.816 85.4326L167.885 106.502C169.084 101.794 169.89 96.9297 170.267 91.9451L163.755 85.4326L170.267 78.9201C169.89 73.9356 169.084 69.071 167.885 64.3631Z"
        fill={mainColor == 'none' ? `#B5E8D4` : mainColor}
      />
      <Path
        d="M132.01 156.67L85.3815 110.042V126.981L121.121 162.721C124.91 160.966 128.548 158.941 132.01 156.67Z"
        fill={mainColor == 'none' ? `#547980` : mainColor}
      />
      <Path
        d="M108.421 167.41L85.3815 144.37L85.3815 161.309L94.187 170.114C99.0657 169.613 103.822 168.7 108.421 167.41Z"
        fill={mainColor == 'none' ? `#594F4F` : mainColor}
      />
      <Path
        d="M73.22 1.164C77.192 0.595848 81.2524 0.30188 85.3816 0.30188V170.564C81.2524 170.564 77.192 170.27 73.22 169.702L73.22 1.164Z"
        fill={mainColor == 'none' ? `#CC6248` : mainColor}
      />
      <Path
        d="M48.8968 8.49429C52.7966 6.6417 56.8596 5.07687 61.0584 3.82726L61.0584 167.039C56.8596 165.789 52.7966 164.224 48.8968 162.372L48.8968 8.49429Z"
        fill={mainColor == 'none' ? `#E4825F` : mainColor}
      />
      <Path
        d="M24.5736 25.8536C28.2927 22.0583 32.3642 18.6098 36.7352 15.5609L36.7352 155.305C32.3642 152.256 28.2927 148.808 24.5736 145.012L24.5736 25.8536Z"
        fill={mainColor == 'none' ? `#EEA35F` : mainColor}
      />
      <Path
        d="M0.250437 85.3909C0.2582 69.3575 4.69836 54.3605 12.412 41.559L12.412 129.307C4.69835 116.505 0.258196 101.509 0.250437 85.4751C0.250431 85.4611 0.250427 85.447 0.250427 85.433C0.250427 85.419 0.250431 85.4049 0.250437 85.3909Z"
        fill={mainColor == 'none' ? `#FFBF86` : mainColor}
      />
    </Svg>
  )
}
