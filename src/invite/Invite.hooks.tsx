import { isNil } from 'lodash'
import { useEffect, useState } from 'react'

import { createDynamicLink } from './Invite.utils'

export function useShareUrl(address: string | null) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      if (isNil(address)) return
      const url = await createDynamicLink(address)
      setShareUrl(url)
    })()
    return () => setShareUrl(null)
  }, [address])

  return shareUrl
}
