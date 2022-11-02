import React, { useRef } from 'react'
import { Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'

import { noHeader } from 'src/navigator/Headers'

const content = `
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Sunsets don&#39;t get much better than this one over <a href="https://twitter.com/GrandTetonNPS?ref_src=twsrc%5Etfw">@GrandTetonNPS</a>. <a href="https://twitter.com/hashtag/nature?src=hash&amp;ref_src=twsrc%5Etfw">#nature</a> <a href="https://twitter.com/hashtag/sunset?src=hash&amp;ref_src=twsrc%5Etfw">#sunset</a> <a href="http://t.co/YuKy2rcjyU">pic.twitter.com/YuKy2rcjyU</a></p>&mdash; US Department of the Interior (@Interior) <a href="https://twitter.com/Interior/status/463440424141459456?ref_src=twsrc%5Etfw">May 5, 2014</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Sunsets don&#39;t get much better than this one over <a href="https://twitter.com/GrandTetonNPS?ref_src=twsrc%5Etfw">@GrandTetonNPS</a>. <a href="https://twitter.com/hashtag/nature?src=hash&amp;ref_src=twsrc%5Etfw">#nature</a> <a href="https://twitter.com/hashtag/sunset?src=hash&amp;ref_src=twsrc%5Etfw">#sunset</a> <a href="http://t.co/YuKy2rcjyU">pic.twitter.com/YuKy2rcjyU</a></p>&mdash; US Department of the Interior (@Interior) <a href="https://twitter.com/Interior/status/463440424141459456?ref_src=twsrc%5Etfw">May 5, 2014</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
`

const wrapper = `<html><head><meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no'></head><body>${content}</body></html>`

export default function Invite() {
  const webViewRef = useRef<null | WebView>(null)

  return (
    <>
      <SafeAreaView
        style={{
          height: '100%',
        }}
      >
        <WebView
          ref={webViewRef}
          onError={(e) => console.warn(e)}
          onHttpError={(e) => console.warn(e)}
          onMessage={(m) => console.log('MESSAGE', m)}
          onLoadStart={(m) => console.log('LOAD STARTED', m)}
          onLoad={(m) => console.log('LOADED', m)}
          originWhitelist={['*']}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          onNavigationStateChange={async (event) => {
            console.log('navigation state change...', event)
            if (event.url === 'about:blank') return
            webViewRef.current?.stopLoading()
            const result = await Linking.openURL(event.url)
            console.log('DONE LINKING', result)
          }}
          source={{
            html: wrapper,
          }}
        />
      </SafeAreaView>
    </>
  )
}

Invite.navOptions = noHeader
