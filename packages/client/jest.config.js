const base = require('../../jest.base.config.js')

module.exports = {
  ...base,
  testMatch: ['<rootDir>/src/**/*.test.[jt]s?(x)'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', {
      cwd: __dirname
    }]
  },
  moduleNameMapper: {
    '^react$': 'preact/compat',
    '^react-dom$': 'preact/compat',
    '^@storybook/preact$': '@storybook/react'
  },
  snapshotSerializers: ['jest-serializer-html'],
  setupFiles: [
    '<rootDir>/lib/jest.setup.js'
  ]
}
