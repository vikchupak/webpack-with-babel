const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const OptimizeCssAssetsWebpackPlugin = require("optimize-css-assets-webpack-plugin");
const TerserWebpackPugin = require("terser-webpack-plugin");


const isDev = process.env.NODE_ENV === "development";//нода має доступ до цієї системної змінної
const isProd = !isDev;

const optimization = () => {
    const optConfig = {
        splitChunks: {
            chunks: "all" // виносити однаковий дублирующийся код в окремі файли; вшита настройка вебпак
        },
        minimizer: [//мініфікуєм js і css
            new OptimizeCssAssetsWebpackPlugin(),//css
            new TerserWebpackPugin()//js
        ]
    };
    if (isProd) {
        return optConfig;
    }
};

const conf = {
    mode: "development",//можна не указувати, итак по умолчанию стоїть
    context: path.resolve(__dirname, "src"),//папка относительно которой будет работать webpack ДЛЯ ВІДНОСНИХ ШЛЯХІВ. ДЛЯ АБСОЛЮТНИХ ЧЕРЕЗ resolve(__dirname...
    entry: ["@babel/polyfill", "./main.js"],
    output: {
        filename: isDev ? "main.js" : "main.[hash].js",
        path: path.resolve(__dirname, "dist")
    },
    resolve: {
        //extensions: [".js", ".ts", ".tsx", ".jsx"],//разширения файлов которие будут распознаватся webpack по умолчанию; по сути добавлять если не хочеться писать разширение каждий раз вручную; за замовчуванням вебпак розуміє .js и .json
        alias: {
            "@": path.resolve(__dirname, "src")//абсолютний шлях до папки, тепер можна простіше до неї звертатись через еліас
        }
    },
    optimization: optimization(),
    //devtool: isDev ? "sourceMap" : false,
    devtool: isDev ? "source-map" : false,
    //devtool: isDev ? "eval-source-map" : "source-map",//використовувати сорс мап в залежносты від моду
    
    devServer: {
       port: 8000,
       hot: isDev
    },
    plugins: [
        new HTMLPlugin({
            template: "./index.html",
            minify: {
                collapseWhitespace: isProd//мініфікація HTML в прод режимі
            }
        }),
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: isDev ? "style.css" : "style.[hash].css",
          }),
        new CopyWebpackPlugin([//налаштовуєм звідки - куди копіювати статичні файли; на дев сервері не видно, бо він працює з оперативкою
            {
                from: path.resolve(__dirname, "src/favicon.ico"),
                to: path.resolve(__dirname, "dist")
            }
        ])
    ],
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,//лоадер щоб вигрузити css в окремий файл
                        options: {
                            hmr: isDev,//тільки коли ми в режимі разработки => isDev для визначення для визначення режиму
                            reloadAll: true
                        },
                    },
                    "css-loader"
                ]
            },

            {
                test: /\.scss$/i,
                //test: /\.s[ac]ss$/i,
                //test: /\.(scss)$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,//лоадер щоб вигрузити css в окремий файл
                        options: {
                            hmr: isDev,//тільки коли ми в режимі разработки => isDev для визначення для визначення режиму
                            reloadAll: true
                        },
                    },
                    {
                        loader: "css-loader",
                        options: {
                            sourceMap: true
                        }
                    },
                    {
                        loader: "sass-loader",
                        options: {
                            //implementation: require('node-sass'),
                            sourceMap: true
                        }
                    }
                ]
            },

            {
                test: /\.(jpg|png)$/i,
                use: ["file-loader"]
            },

            { 
                test: /\.js$/,
                exclude: /node_modules/,
                use: { 
                    loader: "babel-loader",
                    options: {
                        "presets": [
                            "@babel/preset-env",
                        ],
                        "plugins": [
                            "@babel/plugin-proposal-class-properties",
                            "@babel/plugin-proposal-object-rest-spread"
                        ]
                    }
                }
            }
        ]
    }
}

module.exports = conf