const webpack = require('webpack')
const path = require('path')

const time = Date.now()

// dev environment
let env = 'dev'
let devtool = 'eval'
let mode = 'development'
let stats = 'minimal'

// production environment
if (JSON.parse(process.env.NODE_ENV || 0)) {
  env = 'prod'
  devtool = 'hidden-source-map'
  mode = 'production'
  stats = 'none'
}

console.log('Webpack build - ENV: ' + env + ' V: ' + time)

module.exports = {
  entry: [
    './src/index.js',
  ],

  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },

  mode: mode,

  // configuration regarding modules
  module: {
    rules: [
      {
        test: /\.js?$/,
        // the loader which should be applied, it'll be resolved relative to the context
        // -loader suffix is no longer optional in webpack2 for clarity reasons
        // see webpack 1 upgrade guide
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },

  // options for resolving module requests
  // (does not apply to resolving to loaders)
  resolve: {

    // directories where to look for modules,
    modules: [
      'node_modules',
      path.resolve(__dirname, 'app'),
    ],

    // extensions that are used
    extensions: ['.js', '.json', '.css'],

    alias: {
      three$: 'three/build/three.min.js',
      'three/.*$': 'three',
      // from https://gist.github.com/cecilemuller/0be98dcbb0c7efff64762919ca486a59
      // dont need to register alias for every threejs module
    },
  },

  performance: {
    hints: 'warning', // enum
  },

  // lets you precisely control what bundle information gets displayed
  stats: stats,

  // enhance debugging by adding meta info for the browser devtools
  // source-map most detailed at the expense of build speed.
  devtool: devtool, // enum

  devServer: {
    contentBase: 'dist',
  },

  plugins: [
    new webpack.DefinePlugin({
      __ENV__: JSON.stringify(env),
      ___BUILD_TIME___: time,
    }),
    new webpack.ProvidePlugin({
      THREE: 'three',
    }),
  ],
}
