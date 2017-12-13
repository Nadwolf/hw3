const webpack = require('webpack');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const config = {
    output: {
        filename: 'main.js'
    },
    plugins: [
        new UglifyJSPlugin({
            sourceMap: true
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "eslint-loader",
                options: {
                    fix: true
                }            
            }                                  
        ]
    }
};

module.exports = config;