const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        'background': './src/ts/background.ts',
        'injected': './src/ts/injected.ts'
    },
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                  ],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader',
                ]
            }
            
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: 'static', to: '' }
            ]
        })
    ]
};