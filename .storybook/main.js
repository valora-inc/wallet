module.exports = {
  // stories: ['./stories/**/*.stories.?(ts|tsx|js|jsx)'],
  stories: ['../src/components/**/*.stories.?(ts|tsx|js|jsx)'],
  staticDirs: ['../fonts'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    // '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-react-native-web',
  ],

  framework: {
    name: '@storybook/react-vite',
    // name: '@storybook/react-webpack5',
    options: {},
  },

  docs: {
    autodocs: true,
  },
  typescript: {
    // reactDocgen: 'react-docgen-typescript-plugin',
    reactDocgen: 'react-docgen-typescript-plugin',
    // reactDocgen: 'any-string',
  },
}
