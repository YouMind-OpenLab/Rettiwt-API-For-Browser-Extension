const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    popup: './src/popup.ts',
    background: './src/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true, // Skip type checking for faster builds
            compilerOptions: {
              // Override rootDir for external files
              rootDir: undefined,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Point to the compiled browser module
      'rettiwt-api/browser': path.resolve(__dirname, '../../dist/browser/browser/index.js'),
      // Alias for process/browser
      'process/browser': require.resolve('process/browser'),
    },
    fallback: {
      // Polyfills for Node.js modules used by the library
      querystring: require.resolve('querystring-es3'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      util: require.resolve('util/'),
      url: require.resolve('url/'),
      process: require.resolve('process/browser'),
      path: false,
      fs: false,
      https: false,
      http: false,
      net: false,
      tls: false,
      crypto: false,
      zlib: false,
      perf_hooks: false,
      canvas: false,
    },
    // Also look in the example's node_modules for resolving
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ],
  },
  plugins: [
    // Provide Buffer and process globally
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
    }),
  ],
  devtool: 'source-map',
};
