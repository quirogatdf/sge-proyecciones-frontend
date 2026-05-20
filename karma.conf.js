const { merge } = require('lodash');
const baseConfig = require('./karma.conf.base.js');

module.exports = function (config) {
  config.set(
    merge(baseConfig, {
      files: ['src/**/*.integration.spec.ts'],
      preprocessors: {
        'src/**/*.integration.spec.ts': ['esbuild'],
      },
      esbuild: {
        target: 'es2022',
        loaders: {
          '.ts': ['ts', 'angular'],
        },
      },
      plugins: [
        require('karma-jasmine'),
        require('karma-chrome-launcher'),
        require('karma-jasmine-html-reporter'),
        require('karma-coverage'),
      ],
    })
  );
};
