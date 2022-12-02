import Clipboard from '@react-native-clipboard/clipboard'
import { useEffect, useState } from 'react'
import { AppState } from 'react-native'
import { deviceIsIos14OrNewer } from 'src/utils/IosVersionUtils'
import Logger from 'src/utils/Logger'

const CLIPBOARD_CHECK_INTERVAL = 1000 // 1sec

// Return values:
// - forceShowingPasteIcon: boolean -> true if we can't read the clipboard continuously so we should show
//      any pasting indicators without checking the string content.
// - clipboardContent: string -> Latest read from the clipboard we have. Will be empty on iOS 14 and above.
// - getFreshClipboardContent: () => Promise<string> -> Fetches the content from the clipboard. It will show
//      a notification to the user on iOS 14 and above.
export function useClipboard(): [boolean, string, () => Promise<string>] {
  const [forceShowingPasteIcon, setForceShowingPasteIcon] = useState(false)
  const [clipboardContent, setClipboardContent] = useState('')

  useEffect(() => {
    let isMounted = true

    async function checkClipboardContent() {
      try {
        if (deviceIsIos14OrNewer()) {
          setForceShowingPasteIcon(await Clipboard.hasString())
          return
        }

        const newClipboardContent = await Clipboard.getString()
        if (!isMounted) {
          return
        }

        setClipboardContent(newClipboardContent)
      } catch (error) {
        Logger.error('useClipboard', 'Error checking clipboard contents', error)
      }
    }

    const interval = setInterval(checkClipboardContent, CLIPBOARD_CHECK_INTERVAL)

    const appStateListener = AppState.addEventListener('change', checkClipboardContent)

    checkClipboardContent().catch(() => {
      // Ignored
    })

    return () => {
      isMounted = false
      appStateListener.remove()
      clearInterval(interval)
    }
  }, [])

  return [forceShowingPasteIcon, clipboardContent, Clipboard.getString]
}
