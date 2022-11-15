import React, { FunctionComponent } from 'react'
import { useRevokeCurrentPhoneNumber } from 'src/verify/hooks'

interface Props {
  children: (asyncResult: ReturnType<typeof useRevokeCurrentPhoneNumber>) => React.ReactElement
}

// Temporary wrapper to use the hook in a class component
export const RevokePhoneNumber: FunctionComponent<Props> = ({ children }) => {
  const asyncResult = useRevokeCurrentPhoneNumber()

  return children(asyncResult)
}
