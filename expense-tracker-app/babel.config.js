module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
          browsers: [
            'last 2 versions',
            '> 1%',
            'not dead',
            'not ie 11'
          ]
        },
        useBuiltIns: 'usage',
        corejs: 3,
        modules: 'auto',
        debug: false
      }
    ]
  ],
  plugins: [
    '@babel/plugin-transform-runtime',
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-null
