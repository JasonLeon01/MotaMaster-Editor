const webpack = require('webpack');

module.exports = {
    webpack: {
        configure: {
            resolve: {
                fallback: {
                    "path": require.resolve("path-browserify"),
                    "fs": false,
                    "crypto": false,
                    "stream": false,
                    "buffer": false
                }
            },
            target: 'electron-renderer',
            plugins: [
                new webpack.ProvidePlugin({
                    process: 'process/browser'
                })
            ]
        }
    }
};