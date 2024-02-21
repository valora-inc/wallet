import React from 'react'
import JumpstartToastError from 'src/jumpstart/JumpstartToastError'
import JumpstartToastLoading from 'src/jumpstart/JumpstartToastLoading'

export default function JumpstartToasts() {
  return (
    <>
      <JumpstartToastLoading />
      <JumpstartToastError />
    </>
  )
}
