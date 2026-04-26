const path = require('path');

module.exports = {
  entry: './services/firebaseService.js',
  output: {
    filename: 'firebaseService.bundle.js',
    path: path.resolve(__dirname, 'services'),
  },
  mode: 'production',
};
