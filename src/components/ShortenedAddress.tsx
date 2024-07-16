import * as React from 'react'
import { StyleProp, Text, TextStyle } from 'react-native'
import { Address } from 'viem'

interface Props {
  style: StyleProp<TextStyle>
  address: Address
}

export function formatShortenedAddress(address: Address): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function ShortenedAddress({ style, address }: Props) {
  return <Text style={style}>{formatShortenedAddress(address)}</Text>
}
