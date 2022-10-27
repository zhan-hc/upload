const target = "http://localhost:3000/"
const port = 8080; // 打开时的端口
module.exports = {
    publicPath: "./",  // 访问路径，相对路径不然容易出现白屏
    outputDir: "dist",  // 输出的文件夹
    assetsDir: "static",  // 静态文件的存放wei'z位置
    lintOnSave: false,  // 是否启用esLint
    productionSourceMap: true, // 生产环境文件是是否包含.map文件
    devServer: {
        open: true, // 启动后是否需要自动打开浏览器
        disableHostCheck: true,
        port: port, // 启用后的端口
        overlay: {
            warnings: false,
            errors: true,
        },
        proxy: {
            "/": {
                target, // 跨域的链接
                changeOrigin: true, // 是否跨域
                pathRewrite: { // 重写请求链接
                    // "^/": ""
                },
            }
        }
    },
    css: {
        // 不用在每一个页面都进行引入样式，就能直接引用。
        loaderOptions: { // sass-loader
            sass: {
                // prependData: `@import '@/styles/variables.scss';`,
            },
        },
        sourceMap: true
    },
}