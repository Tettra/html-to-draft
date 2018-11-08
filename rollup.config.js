import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import svgr from '@svgr/rollup'
import { terser } from 'rollup-plugin-terser'

import pkg from './package.json'

const outputs = [
  {
    file: pkg.main,
    format: 'cjs',
    sourcemap: true
  },
  {
    file: pkg.module,
    format: 'es',
    sourcemap: true
  }
]

const config = {
  input: 'src/index.js',
  external: ['draft-js/lib/getSafeBodyFromHTML'],
  plugins: [
    external(),
    url(),
    svgr(),
    babel({
      exclude: 'node_modules/**',
      plugins: [ '@babel/proposal-class-properties' ]
    }),
    resolve(),
    commonjs()
  ]
}

export default outputs.map(output => ({
  ...config,
  output: output
}))
