module.exports = api => {
  api.cache.forever()

  return {
    presets: [
      ['@babel/preset-typescript', {
        isTSX: true,
        allExtensions: true
      }],
      ['@babel/preset-react', {
        pragma: 'jsx',
        pragmaFrag: 'Fragment'
      }],
      ['@babel/preset-env', {
        targets: { esmodules: true },
        bugfixes: true
      }]
    ]
  }
}
