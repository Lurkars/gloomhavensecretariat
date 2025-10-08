const path = require('path');

module.exports = {
  resolve: {
    fallback: {
      "fs": false,
      "path": false,
      "crypto": false,
      "stream": false,
      "util": false,
      "buffer": false,
      "assert": false
    }
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        mermaid: {
          test: /[\\/]node_modules[\\/](mermaid|dayjs|d3|dagre|cytoscape|elkjs|@braintree\/sanitize-url|debug|vscode-jsonrpc)[\\/]/,
          name: 'mermaid-vendor',
          chunks: 'async',
          priority: 20,
          enforce: true,
          minSize: 0
        },
        vendor: {
          test: /[\\/]node_modules[\\/](?!(mermaid|dayjs|d3|dagre|cytoscape|elkjs|@braintree\/sanitize-url|debug|vscode-jsonrpc))[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        }
      }
    },
    usedExports: true,
    sideEffects: false
  },
  module: {
    rules: [
      {
        test: /node_modules[\\/]mermaid[\\/]/,
        sideEffects: false
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  }
};