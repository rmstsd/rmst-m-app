import { Pusher, PusherChannel, PusherEvent } from '@pusher/pusher-websocket-react-native'
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useEffect, useRef, useState } from 'react'
import { AppState, Button, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

const PUSHER_CHANNEL_NAME = 'my-channel'
const pusher = Pusher.getInstance()

let pusherReadyPromise: Promise<void> | null = null

async function ensurePusherReady() {
  if (!pusherReadyPromise) {
    pusherReadyPromise = (async () => {
      await pusher.init({ apiKey: 'b0486ed6384e83d43689', cluster: 'ap1' })
      await pusher.connect()
    })().catch(error => {
      pusherReadyPromise = null
      throw error
    })
  }

  await pusherReadyPromise
}

function parseEventData(data: unknown): any {
  if (typeof data !== 'string') {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()

  const [appState, setAppState] = useState(AppState.currentState)
  const [canScan, setCanScan] = useState(true)
  const channelRef = useRef<PusherChannel | null>(null)
  const subscribePromiseRef = useRef<Promise<PusherChannel> | null>(null)

  const handlePusherEvent = (event: PusherEvent) => {
    console.log('Event received')
    console.log(event)
    const data = parseEventData(event.data)

    switch (event.eventName) {
      case 'open-url': {
        if (!data || typeof data.url !== 'string') {
          console.error('open-url payload 无效', data)
          break
        }

        openLinkingURL(data.url)
        break
      }

      default: {
        console.error('未匹配', event.eventName)
        break
      }
    }
  }

  const subscribeChannel = async () => {
    if (subscribePromiseRef.current) {
      return subscribePromiseRef.current
    }

    subscribePromiseRef.current = (async () => {
      const existingChannel = pusher.getChannel(PUSHER_CHANNEL_NAME)
      if (existingChannel) {
        existingChannel.onEvent = handlePusherEvent
        channelRef.current = existingChannel
        return existingChannel
      }

      const channel = await pusher.subscribe({
        channelName: PUSHER_CHANNEL_NAME,
        onEvent: handlePusherEvent
      })

      channelRef.current = channel
      return channel
    })()

    try {
      return await subscribePromiseRef.current
    } finally {
      subscribePromiseRef.current = null
    }
  }

  const subscribe = async () => {
    await ensurePusherReady()
    return subscribeChannel()
  }

  const unsubscribe = async () => {
    subscribePromiseRef.current = null

    if (!pusher.getChannel(PUSHER_CHANNEL_NAME)) {
      channelRef.current = null
      return
    }

    await pusher.unsubscribe({ channelName: PUSHER_CHANNEL_NAME })
    channelRef.current = null
  }

  useEffect(() => {
    let isCancelled = false

    void (async () => {
      try {
        await ensurePusherReady()
        if (isCancelled) {
          return
        }

        await subscribeChannel()
      } catch (error) {
        console.error('Pusher 初始化失败', error)
      }
    })()

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('nextAppState', nextAppState)
      setAppState(nextAppState)
      // setCanScan(nextAppState === 'active')
    })

    return () => {
      isCancelled = true
      void unsubscribe().catch(error => console.error('取消订阅失败', error))
      subscription.remove()
    }
  }, [])

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

  function openLinkingURL(url) {
    Linking.openURL(url).catch(err => console.error('An error occurred', err))
  }

  return (
    <View style={styles.container}>
      <Button title="open" onPress={() => {}} />
      <Button
        title="订阅"
        onPress={() => {
          void subscribe().catch(error => console.error('订阅失败', error))
        }}
      />
      <Button
        title="取消订阅"
        onPress={() => {
          void unsubscribe().catch(error => console.error('取消订阅失败', error))
        }}
      />
    </View>
  )

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>加载中...</Text>
      </View>
    )
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    )
  }

  let camEle = (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        onBarcodeScanned={barcode => {
          if (!canScan) {
            return
          }
          const url = barcode.data
          if (isValidURL(url)) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)

            setCanScan(false)
            openLinkingURL(url)
          } else {
            console.log('Invalid URL:', url)
          }
        }}
      >
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => setCanScan(true)}>
            <Text style={styles.text}>扫码</Text>
            <Text style={styles.text}>appState: {appState}</Text>
            <Text style={styles.text}>canScan: {String(canScan)}</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  )

  return camEle
}

function isValidURL(text) {
  const urlPattern = /^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i
  return urlPattern.test(text)
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: 10,
    alignItems: 'center'
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10
  },
  camera: {
    flex: 1
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  }
})
