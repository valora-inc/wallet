import React from 'react'
import JumpstartClaimStatusError from 'src/jumpstart/JumpstartClaimStatusError'
import JumpstartClaimStatusLoading from 'src/jumpstart/JumpstartClaimStatusLoading'

export default function JumpstartClaimStatusToasts() {
  return (
    <>
      <JumpstartClaimStatusLoading />
      <JumpstartClaimStatusError />
    </>
  )
}
