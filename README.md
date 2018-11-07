# html-to-draft


![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/badges/shields.svg)
![Build Status](https://travis-ci.org/juliankrispel/html-to-draft.svg?branch=master)

> parse html to draft js content state

[![NPM](https://img.shields.io/npm/v/html-to-draft.svg)](https://www.npmjs.com/package/html-to-draft) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

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

MIT © [juliankrispel](https://github.com/juliankrispel)
