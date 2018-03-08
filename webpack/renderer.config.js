const path = require('path');

//const ELECTRON_RENDERER_PROCESS_ROOT = path.resolve(__dirname, 'src/renderer/');

module.exports = {
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: "babel-loader",
          options: {
            presets: ["react"]
          }
        }
      ]
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
}
