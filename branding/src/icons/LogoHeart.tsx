import * as React from 'react'
import Svg, {
  ClipPath,
  Defs,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
  SvgProps,
} from 'react-native-svg'

interface Props {
  size?: number
  testID?: string
  // Setting this to SvgProps['color'] for now as the Colors enum is not a part of the branding folder yet.
  color?: SvgProps['color']
}

export default function LogoHeart({ size = 32, testID, color }: Props) {
  return (
    <Svg viewBox="0 0 889 889" width={size} height={size} testID={testID}>
      <Defs>
        <RadialGradient
          id="e"
          cx={3092.1}
          cy={974.1}
          r={0.2}
          fx={3092.1}
          fy={974.1}
          gradientTransform="rotate(68.4 472665.336 -5040857.337) scale(1612.4 -2818.5)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#00e09d'} />
          <Stop offset={0.2} stopColor={color ?? '#00e09d'} stopOpacity={0.9} />
          <Stop offset={1} stopColor={color ?? '#3beb9f'} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="f"
          cx={3090.4}
          cy={972.4}
          r={0.2}
          fx={3090.4}
          fy={972.4}
          gradientTransform="rotate(47.2 190107.028 -7577516.78) scale(1819.1 -2355.8)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#19cf7a'} />
          <Stop offset={1} stopColor={color ?? '#82d148'} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="g"
          cx={3100.9}
          cy={978.7}
          r={0.2}
          fx={3100.9}
          fy={978.7}
          gradientTransform="rotate(-101.1 2998729.964 928626.99) scale(1446.8 -1874.4)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#f79a0f'} />
          <Stop offset={0.3} stopColor={color ?? '#f4a227'} stopOpacity={0.9} />
          <Stop offset={1} stopColor={color ?? '#e6c832'} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="i"
          cx={3084.8}
          cy={972.4}
          r={0.2}
          fx={3084.8}
          fy={972.4}
          gradientTransform="rotate(52.8 71120.128 -2845995.122) scale(744.2 -1099.2)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#73d444'} />
          <Stop offset={0.3} stopColor={color ?? '#73d444'} stopOpacity={0.5} />
          <Stop offset={1} stopColor={color ?? '#73d444'} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="j"
          cx={3092.3}
          cy={968.8}
          r={0.2}
          fx={3092.3}
          fy={968.8}
          gradientTransform="rotate(93.3 1609215.68 -2649085.184) scale(1405.7 -1234.2)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#00cf5c'} />
          <Stop offset={0.3} stopColor={color ?? '#00cf5c'} stopOpacity={0.8} />
          <Stop offset={0.6} stopColor={color ?? '#00d05b'} stopOpacity={0.2} />
          <Stop offset={1} stopColor={color ?? '#00d05b'} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient
          id="k"
          cx={3092.9}
          cy={975.2}
          r={0.2}
          fx={3092.9}
          fy={975.2}
          gradientTransform="matrix(1523.058 1821.55694 3063.82747 -2561.7574 -7698928.8 -3135152.8)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#fff'} stopOpacity={0.7} />
          <Stop offset={0.8} stopColor={color ?? '#fff'} stopOpacity={0} />
          <Stop offset={1} stopColor={color ?? '#fff'} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient
          id="b"
          x1={1475.2}
          x2={1647.6}
          y1={-171.4}
          y2={17.3}
          gradientTransform="matrix(1 0 0 -1 -1065 312.6)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#35d07f'} stopOpacity={0} />
          <Stop offset={1} stopColor={color ?? '#00d063'} />
        </LinearGradient>
        <LinearGradient
          id="c"
          x1={1383.8}
          x2={1621.8}
          y1={-490.9}
          y2={182}
          gradientTransform="matrix(1 0 0 -1 -1065 312.6)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#f8cd0c'} />
          <Stop offset={0.3} stopColor={color ?? '#f2ce27'} />
          <Stop offset={1} stopColor={color ?? '#86d23c'} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient
          id="d"
          x1={1178.3}
          x2={1711.7}
          y1={-316.8}
          y2={-21.4}
          gradientTransform="matrix(1 0 0 -1 -1065 312.6)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#fdeb3f'} />
          <Stop offset={1} stopColor={color ?? '#fbc74b'} stopOpacity={0} />
        </LinearGradient>
        <LinearGradient
          id="h"
          x1={1417}
          x2={1449.8}
          y1={241.1}
          y2={109.8}
          gradientTransform="matrix(1 0 0 -1 -1065 312.6)"
          gradientUnits="userSpaceOnUse"
        >
          <Stop offset={0} stopColor={color ?? '#39e2a4'} />
          <Stop offset={1} stopColor={color ?? '#67e290'} stopOpacity={0} />
        </LinearGradient>
        <ClipPath id="a">
          <Path
            d="M760.1 539c-61.3 84.8-184.3 196.4-315.6 263.9C313.2 735.4 190.2 623.8 128.9 539c-40.3-55.7-76.3-120.1-74.3-189.5 2.1-72 48.5-139.7 112.3-169 63.8-29.3 141.7-20.7 200 19 33.1 22.5 59.6 54.4 77.6 90.9 18-36.5 44.5-68.3 77.6-90.9 58.3-39.7 136.2-48.4 200-19 63.8 29.4 110.2 97.1 112.3 169 2 69.4-34 133.8-74.3 189.5Z"
            fill="none"
            strokeWidth={0}
          />
        </ClipPath>
      </Defs>
      <G
        style={{
          clipPath: 'url(#a)',
        }}
      >
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="#35d07f" strokeWidth={0} />
        <Path
          d="M35.2 35.2h820.6v820.6H35.2V35.2Z"
          fill="url(#b)"
          fillOpacity={0.8}
          strokeWidth={0}
        />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#c)" strokeWidth={0} />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#d)" strokeWidth={0} />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#e)" strokeWidth={0} />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#f)" strokeWidth={0} />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#g)" strokeWidth={0} />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#h)" strokeWidth={0} />
        <Path
          d="M35.2 35.2h820.6v820.6H35.2V35.2Z"
          fill="url(#i)"
          fillOpacity={0.6}
          strokeWidth={0}
        />
        <Path d="M35.2 35.2h820.6v820.6H35.2V35.2Z" fill="url(#j)" strokeWidth={0} />
        <Path d="M0 0h889v889H0V0Z" fill="url(#k)" fillOpacity={0.5} strokeWidth={0} />
      </G>
      <Path
        d="M494.9 700.9C517.5 530.8 600.5 434 725.8 346.3l-64.1-81.4c-82 60.6-171.5 146.5-213 265-33.9-96.8-104.6-181.8-218.7-265l-66.9 83.2c142.3 97.7 214 207.2 233.7 352.8h98Z"
        fill="#fff"
        strokeWidth={0}
      />
    </Svg>
  )
}
