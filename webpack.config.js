// webpack.config.js
const path = require('path');
const webpack = require('webpack');

module.exports = {
  // Other webpack configurations...
  resolve: {
    fallback: {
      "fs": false, // This tells webpack to not include the 'fs' module
      "path": require.resolve("path-browserify")
    }
  },
  plugins: [
    // This is an alternative to the fallback above, which can sometimes be needed
    // new webpack.IgnorePlugin({
    //   resourceRegExp: /fs/
    // }),
  ],
};