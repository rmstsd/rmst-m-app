import type { ConfigContext, ExpoConfig } from 'expo/config'
import type { WithAndroidWidgetsParams } from 'react-native-android-widget'

const widgetConfig: WithAndroidWidgetsParams = {
  fonts: ['./assets/fonts/SpaceMono-Regular.ttf'],
  widgets: [
    {
      name: 'Hello',
      label: 'My Hello Widget',
      minWidth: '320dp',
      minHeight: '120dp',
      targetCellWidth: 5,
      targetCellHeight: 2,
      description: 'This is my first widget',
      previewImage: './assets/images/react-logo.png',
      updatePeriodMillis: 1800000
    }
  ]
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'rmst-m-app',
  slug: 'rmst-m-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    imageWidth: 200,
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true
  },
  scheme: 'androidwidgetexample',
  newArchEnabled: true,
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#FFFFFF'
    },
    edgeToEdgeEnabled: true,
    package: 'com.rmstsd.rmstmapp'
  },
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: {},
    eas: {
      projectId: 'e5435add-a257-446b-a5fd-75e2e7537ff5'
    }
  }
  // plugins: [['react-native-android-widget', widgetConfig]]
})
