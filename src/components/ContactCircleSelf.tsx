import * as React from 'react'
import { ViewStyle } from 'react-native'
import { currentUserRecipientSelector } from 'src/account/selectors'
import ContactCircle from 'src/components/ContactCircle'
import { Recipient } from 'src/recipients/recipient'
import { useSelector } from 'src/redux/hooks'
interface Props {
  style?: ViewStyle
  size?: number
}

// A contact circle for the wallet user themselves
export default function ContactCircleSelf({ style, size }: Props) {
  const recipient: Recipient = useSelector(currentUserRecipientSelector)

  return <ContactCircle style={style} recipient={recipient} size={size} />
}
