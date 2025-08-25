import { CameraType, CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { useEffect, useState } from 'react'
import { AppState, Button, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()

  const [appState, setAppState] = useState(AppState.currentState)
  const [canScan, setCanScan] = useState(true)

  useEffect(() => {
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
      <View>
        <Text style={styles.text}>没权限</Text>
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
