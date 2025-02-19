# Configuring Your Divvi Mobile App

Divvi Mobile apps are configured through a single configuration object passed to `createApp`. By default, you get a fully functioning Divvi app with sensible defaults.

Since Divvi Mobile is built on top of Expo, you also get all the benefits of a standard Expo app. This means you can use any Expo configuration options, plugins, and features as documented in the [Expo documentation](https://docs.expo.dev/). Common Expo configurations like app icons, splash screens, and native modules can be configured through your `app.json` or `app.config.js` file.

## Basic Configuration

The minimal configuration requires just a few key properties:

```typescript
import { createApp } from '@divvi/mobile'

const App = createApp({
  // Unique identifier for your app
  registryName: 'my-divvi-app',
  // Display name shown to users
  displayName: 'My Divvi App',
  // URL scheme for deep linking
  deepLinkUrlScheme: 'mydivviapp',
})
```

## Customizing Your App

You can customize various aspects of your app by adding optional configuration:

### Theme Customization

```typescript
const App = createApp({
  // ... basic config
  themes: {
    default: {
      isDark: false,
      colors: {
        // Customize your app's color scheme
        backgroundPrimary: '#FFFFFF',
        contentPrimary: '#000000',
        accent: '#007AFF',
        // See API reference for all available color options
      },
      assets: {
        // Custom logos and images
        welcomeLogo: require('./assets/logo.png'),
        tabHeaderLogo: require('./assets/header-logo.png'),
      },
    },
  },
})
```

### Tab Navigation

```typescript
import { createApp } from '@divvi/mobile'
import { HomeIcon } from './components/icons'
import { HomeScreen } from './screens/Home'

const App = createApp({
  // ... basic config
  screens: {
    tabs: ({ defaultTabs }) => ({
      screens: [
        {
          // Custom home tab
          name: 'home',
          component: HomeScreen,
          icon: ({ focused, color, size }) => (
            <HomeIcon
              size={size}
              color={color}
              focused={focused}
            />
          ),
          label: (t) => t('home.tabLabel'),
        },
        // Default tabs
        defaultTabs.wallet,
        defaultTabs.activity,
        defaultTabs.discover,
      ],
      initialScreen: 'home',
    }),
  },
})
```

### Custom Screens

Beyond tabs, you can add custom screens that can be navigated to from anywhere in your app:

```typescript
import { createApp } from '@divvi/mobile'
import CustomScreen from './screens/CustomScreen'

const App = createApp({
  // ... basic config
  screens: {
    // Tab configuration...
    custom: (Screen) => (
      <>
        <Screen
          name="CustomScreen"
          component={CustomScreen}
          options={{
            headerBackVisible: true,  // Show back button
            headerShown: true,        // Show navigation header
          }}
        />
      </>
    ),
  },
})
```

To enable type-safe navigation, define your screen parameters:

```typescript
import { NativeStackScreenProps, StackParamList } from '@divvi/mobile'

// Define your screen parameters
type RootStackParamList = StackParamList & {
  CustomScreen: {
    someParam: string
  }
}

// Create type-safe screen props
type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>

// Enable type-safe navigation globally
declare global {
  namespace DivviNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

Now you get full type safety when navigating:

```typescript
import { navigate } from '@divvi/mobile'

// TypeScript will ensure you provide the correct parameters
function handleSomeAction() {
  navigate('CustomScreen', {
    someParam: 'value', // Required! TypeScript will error if missing
  })
}
```

And in your screen component:

```typescript
import { NativeStackScreenProps } from '@divvi/mobile'

// Type-safe screen component
function CustomScreen({ route }: RootStackScreenProps<'CustomScreen'>) {
  const { someParam } = route.params // Fully typed!

  return (
    // Your screen content
  )
}
```

### Optional Features

```typescript
const App = createApp({
  // ... basic config
  features: {
    // Enable cloud backup
    cloudBackup: true,
    // WalletConnect integration
    walletConnect: {
      projectId: 'your-project-id',
    },
    // Analytics
    segment: {
      apiKey: 'your-segment-key',
    },
  },
})
```

### Localization

```typescript
const App = createApp({
  // ... basic config
  locales: {
    'en-US': {
      // Override specific translation keys
      'welcome.title': 'Welcome to My App',
    },
    'es-419': {
      'welcome.title': 'Bienvenido a Mi App',
    },
  },
})
```

## Configuration Reference

For a complete list of configuration options, see the [API reference](api-reference.md) or check the type definition:

```typescript
import type { PublicAppConfig } from '@divvi/mobile'
```

## Best Practices

1. **Start Simple**: Begin with the minimal configuration and add customizations as needed
2. **Type Safety**: Use TypeScript to ensure your configuration is valid
3. **Asset Management**: Keep custom assets in an organized directory structure
4. **Feature Flags**: Use the `features` object to enable/disable functionality
5. **Theme Consistency**: Maintain a consistent theme across your app using the theme configuration
