module.exports = (api) => {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // react-native-worklets/plugin MUST be last (SDK 56+, replaces react-native-reanimated/plugin).
    plugins: ['react-native-worklets/plugin'],
  };
};
