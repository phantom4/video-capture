const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  publicPath: './',
  chainWebpack: (config) => {
    // terser plugins
    config.optimization.minimizer('terser').tap((args) => {
      if (isProd) {
        args[0].terserOptions.compress.drop_console = true
      }
      return args
    })
  },
}
