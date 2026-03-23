import { CameraType, CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import Pusher from 'pusher-js/react-native'
import { useEffect, useState } from 'react'
import { AppState, Button, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
export default function App() {
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()

  const [appState, setAppState] = useState(AppState.currentState)
  const [canScan, setCanScan] = useState(true)

  const cc = async () => {
    try {
      // 开启调试日志（生产环境建议关闭）
      Pusher.logToConsole = true

      // 初始化 Pusher
      const pusher = new Pusher('b0486ed6384e83d43689', {
        cluster: 'ap1' // 替换为你的 cluster
      })

      // 订阅频道
      const channel = pusher.subscribe('my-channel')

      // 监听事件
      channel.bind('my-event', function (data) {
        console.log('收到消息:', data)
        alert(JSON.stringify(data))
      })
    } catch (error) {
      console.error('Pusher error:', error)
    }
  }

  useEffect(() => {
    cc()

    const subscription = AppState.addEventListener('change', nextAppState => {
      console.log('nextAppState', nextAppState)
      setAppState(nextAppState)
      // setCanScan(nextAppState === 'active')
    })

    return () => {
      subscription.remove()
    }
  }, [])

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

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'))
  }

  const openURL = url => {
    Linking.openURL(url).catch(err => console.error('An error occurred', err))
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
            openURL(url)
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
    justifyContent: 'center'
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
