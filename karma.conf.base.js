module.exports = {
  basePath: '',
  frameworks: ['jasmine', '@angular-devkit/build-angular'],
  plugins: [
    require('karma-jasmine'),
    require('karma-chrome-launcher'),
    require('karma-jasmine-html-reporter'),
    require('karma-coverage'),
    require('@angular-devkit/build-angular/plugins/karma'),
  ],
  client: {
    jasmine: {
      random: true,
      failFast: false,
    },
    clearContext: false, // to leave Jasmine Spec Runner output visible in browser
  },
  jasmineHtmlReporter: {
    suppressAll: true, // removes the duplicated and auto-generated connection medium
  },
  coverageReporter: {
    dir: require('path').join(__dirname, './coverage/frontend'),
    subdir: '.',
    reporters: [{ type: 'html' }, { type: 'text-summary' }],
  },
  reporters: ['progress', 'kjhtml'],
  port: 9876,
  colors: true,
  logLevel: config.LOG_INFO,
  autoWatch: true,
  browsers: ['ChromeHeadlessNoSandbox'],  // Use headless Chrome
  customLaunchers: {
    ChromeHeadlessNoSandbox: {
      base: 'ChromeHeadless',
      flags: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer']
    }
  },
  singleRun: true,
  restartOnFileChange: true,
};
