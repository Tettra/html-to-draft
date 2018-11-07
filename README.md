# html-to-draft




> parse html to draft js content state

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
![GitHub code size in bytes](http://img.badgesize.io/https://unpkg.com/html-to-draft/dist/index.js?label=size&style=flat-square)
![Build Status](https://travis-ci.org/tettra/html-to-draft.svg?branch=master)
![module formats: cjs, and es](https://img.shields.io/badge/module%20formats-umd%2C%20cjs%2C%20es-green.svg?style=flat-square)
[![NPM](https://img.shields.io/npm/v/html-to-draft.svg)](https://www.npmjs.com/package/html-to-draft)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm install --save html-to-draft
```

## Usage `convertFromHtml`

This package just contains one method, to convert html to draft js content state. For starters, here's all the type info you need to build custom converters.

```js
convertFromHtml(
  html: string,
  options?: {
    parseBlock?: HTMLElement => TextBlock | AtomicBlock
    parseTextFragment?: HTMLElement => TextFragment
  }
)

type TextFragment = {
  offset: number,
  length: number,
  inlineStyle: ?string,
  entity: ?{
    type: string,
    data: ?Object,
  }
}


type AtomicBlock = {
  type: 'atomic',
  entity: ?{
    type: string,
    data: ?Object,
  },
  data: ?Object,
}

type TextBlock = {
  type: ?string,
  depth: ?number,
  data: ?Object,
}
```

## License

MIT © [tettra](https://github.com/tettra)

Developed by [Julian Krispel](https://reactrocket.com)
