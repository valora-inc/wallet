import React from 'react'
import JumpstartError from 'src/jumpstart/JumpstartError'
import JumpstarLoading from 'src/jumpstart/JumpstartLoading'

export default function JumpstartNotifications() {
  return (
    <>
      <JumpstarLoading />
      <JumpstartError />
    </>
  )
}
