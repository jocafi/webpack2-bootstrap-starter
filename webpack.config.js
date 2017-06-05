/////////////////////////////////////////////////////////////////////////////////////////
// 
// Webpack 2 and Bootstrap
// 
// by Jocca on 29.05.17
// 
/////////////////////////////////////////////////////////////////////////////////////////
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require('webpack');
const path = require("path");
const bootstrapEntryPoints = require('./webpack.bootstrap.config');
const glob = require('glob');
const PurifyCSSPlugin = require('purifycss-webpack');

const isProd = process.env.NODE_ENV === 'production'; //true or false
// const isProd = process.argv.indexOf('-p') !== -1   // another option to read the production flag

/////////////////////////////////////////////////////////////////////////////////////////
// Style - CSS - SASS 
// css-loader is used first to load the CSS, if present
// style-loader is used secondly to inject the CSS as inline in the HTML file
// sass-loader will compile the sass files into css files
// ExtractTextPlugin will extract and transform the CSS content into external CSS files.
/////////////////////////////////////////////////////////////////////////////////////////
const cssDev = [
  'style-loader',
  'css-loader?sourceMap',
  'sass-loader',
  {
    loader: 'sass-resources-loader',
    options: {
      // Provide path to the file with resources
      resources: [
                './src/resources.scss'
            ],
    },
  }];
// here the order matters
const cssProd = ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: ['css-loader','sass-loader', {
    loader: 'sass-resources-loader',
    options: {
      // Provide path to the file with resources
      resources: [
        './src/resources.scss'
      ],
    },
  }],
    publicPath: '/dist'
})
// based on the environment (NODE_ENV) we use the CSS configuration 
// for production or delevelopment
const cssConfig = isProd ? cssProd : cssDev;

const bootstrapConfig = isProd ? bootstrapEntryPoints.prod : bootstrapEntryPoints.dev;

const devtoolConfig = isProd ? 'false' : 'source-map';

module.exports = {
    // it controls if and how source maps are generated.
    // options: 
    // eval - pretty fast, but it doesn't display line numbers correctly
    // inline-source-map - a SourceMap is added as a DataUrl to the bundle.
    // eval-source-map - a SourceMap is added as a DataUrl to the eval(). Initially it is slow, but it provides fast rebuild speed.
    // source-map - A full SourceMap is emitted as a separate file. Is is slow.
    // see: https://webpack.js.org/configuration/devtool/
    devtool: devtoolConfig,
    entry: {
        app: './src/app.js',
        bootstrap: bootstrapConfig
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: '[name].bundle.js'
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // Webpack Loaders
    // For each type of file, you need to teach webpack what kind of loader it must use.
    /////////////////////////////////////////////////////////////////////////////////////////
    module: {
        rules: [
            {
                test: /\.scss$/, 
                use: cssConfig
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: 'babel-loader'
            },
            {
                test: /\.ico$/,
                use: 'file-loader?name=images/[name].[ext]'
            },
            {
                test: /\.css$/,
                use: 'file-loader?name=css/[name].[ext]'
            },
            // here the order of the loaders matters
            // file-loader: https://github.com/webpack-contrib/file-loader
            // image-webpack-loader: https://github.com/tcoopman/image-webpack-loader
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [
                  'file-loader?name=images/[name].[ext]',
                  'image-webpack-loader?bypassOnDebug'
                ]
            },
            // apply the url-loader and file-loader to load the bootstrap icon fonts
            { test: /\.(woff2?)$/, use: 'url-loader?limit=10000&name=fonts/[name].[ext]' },
            { test: /\.(ttf|eot)$/, use: 'file-loader?name=fonts/[name].[ext]' },
            // Bootstrap 3 uses jquery
            // https://github.com/shakacode/bootstrap-loader#installation
            { test:/bootstrap-sass[\/\\]assets[\/\\]javascripts[\/\\]/, use: 'imports-loader?jQuery=jquery' }
        ]
    },
    /////////////////////////////////////////////////////////////////////////////////////////
    // DEV SERVER
    // copmpress:  it uses gzip to serve the client / browser requests
    // hot: it uses Hot Module Replacement (https://webpack.js.org/concepts/hot-module-replacement/)
    // open: open the browser at the first run
    // stats: it controls how verbose is the console output
    // See https://webpack.js.org/configuration/dev-server/
    /////////////////////////////////////////////////////////////////////////////////////////
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        compress: true,
        hot: true,
        open: true,
        stats: 'errors-only'
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Project Demo',
            hash: true,
            template: './src/index.html'
        }),
        // ExtractTextPlugin does not work together with Hot Module Replacement(HRM)
        // therefore we use it  only in production
        new ExtractTextPlugin({
            filename: '/css/[name].css',
            disable: !isProd,
            allChunks: true
        }),
        // Hot Module Replacement(HRM) is used in development as a LiveReload replacementto.
        // It watches the changes on the source code or the addition of new modules 
        // and notify the browser without the need to reload the whole application
        // docs: https://webpack.js.org/concepts/hot-module-replacement/
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        // Make sure this is after ExtractTextPlugin!
        new PurifyCSSPlugin({
            // Give paths to parse for rules. These should be absolute!
            paths: glob.sync(path.join(__dirname, 'src/*.html'))
        })
    ]
}
