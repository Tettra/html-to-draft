// @flow

import getSafeBodyFromHTML from 'draft-js/lib/getSafeBodyFromHTML'

const blockTypes = {
  'H1': 'header-one',
  'H2': 'header-two',
  'H3': 'header-three',
  'H4': 'header-four',
  'H5': 'header-five',
  'H6': 'header-six',
  'LI': 'unordered-list-item',
  'BLOCKQUOTE': 'blockquote',
  'PRE': 'code-block',
  'IMG': 'atomic'
}

const textDecorations = {
  underline: 'UNDERLINE',
  'line-through': 'STRIKETHROUGH'
}

const boldValues = ['bold', 'bolder', '500', '600', '700', '800', '900']

const inlineStyleTags = {
  b: 'BOLD',
  code: 'CODE',
  del: 'STRIKETHROUGH',
  em: 'ITALIC',
  i: 'ITALIC',
  s: 'STRIKETHROUGH',
  strike: 'STRIKETHROUGH',
  strong: 'BOLD',
  u: 'UNDERLINE'
}

type RawDraftContentState = {
  blocks: Array<{
    type: ?string,
    text: string,
    depth: ?number,
    inlineStyleRanges: ?Array<{
      style: string,
      offset: number,
      length: number,
    }>,
    entityRanges: ?Array<{
      key: number,
      offset: number,
      length: number,
    }>,
    data?: Object,
  }>,
  entityMap: {[key: string]: {
    type: string,
    mutability: 'MUTABLE' | 'IMMUTABLE' | 'SEGMENTED',
    data: ?{[key: string]: any},
  }},
}

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

type Block = TextBlock | AtomicBlock

class RawDraftContent {
  entityKey: number
  content: RawDraftContentState

  constructor(options) {
    this.entityKey = 0
    this.offset = 0

    if (options && options.parseBlock != null) {
      this.customParseBlock = options.parseBlock
    }

    if (options && options.parseTextFragment != null) {
      this.customParseTextFragment = options.parseTextFragment
    }

    this.content = this.defaultContent = { blocks: [{ text: '' }], entityMap: {} }
  }

  addText = (text) => {
    const lastBlock = this.content.blocks[this.content.blocks.length - 1]
    if (lastBlock.text == null) {
      lastBlock.text = ''
    }

    lastBlock.text += text
    this.offset += text.length
  }

  addBlock = ({ entity, ...block }) => {
    if (block.type === 'atomic') {
      block.text = ' '
    } else if (block.text == null) {
      block.text = ''
    }

    if (entity != null) {
      if (block.entityRanges == null) {
        block.entityRanges = []
      }

      block.entityRanges.push({
        offset: 0,
        length: 1,
        key: this.addEntity(entity)
      })
    }

    const index = this.content.blocks.push(block)

    this.offset = 0

    return this.content.blocks[index - 1]
  }

  addEntity = (entity: Object): string => {
    const key = this.entityKey
    this.content.entityMap[key.toString()] = entity
    this.entityKey += 1
    return key.toString()
  }

  parseTextFragment = (element, offset = 0): TextFragment => {
    let textFragment = null

    if (this.customParseTextFragment != null) {
      const parsedTextFragment = this.customParseTextFragment(element)
      if (parsedTextFragment != null) {
        textFragment = parsedTextFragment
      }
    }

    if (textFragment == null) {
      const inlineStyle = inlineStyleTags[element.nodeName.toLowerCase()]
      const fontWeight = element.style && element.style.fontWeight
      const textDecoration = element.style && element.style.textDecoration
      const fontStyle = element.style && element.style.fontStyle
      const fontFamily = element.style && element.style.fontFamily

      textFragment = {}

      if (inlineStyle != null) {
        textFragment = { inlineStyle }
      }

      if (inlineStyle == null && boldValues.includes(fontWeight)) {
        textFragment = { inlineStyle: 'BOLD' }
      } else if (inlineStyle == null && fontStyle === 'italic') {
        textFragment = { inlineStyle: 'ITALIC' }
      } else if (inlineStyle == null && textDecorations[textDecoration] != null) {
        textFragment = { inlineStyle: textDecorations[textDecoration] }
      } else if (inlineStyle == null && fontFamily === 'monospace') {
        textFragment = { inlineStyle: 'CODE' }
      }

      if (element.nodeName === 'A' && element.attributes.href != null) {
        textFragment = {
          ...textFragment,
          entity: {
            type: 'LINK',
            mutability: 'MUTABLE',
            data: {
              url: element.getAttribute('href'),
              alt: element.getAttribute('rel'),
              title: element.getAttribute('title')
            }
          }
        }
      }
    }

    return textFragment
  }

  parseBlock = (element): Block => {
    let blockType = blockTypes[element.nodeName]
    let block = { }

    if (element.nodeName === 'LI' && element.parentNode.nodeName === 'OL') {
      blockType = 'ordered-list-item'
    }

    if (element.nodeName === 'IMG') {
      block = {
        entity: {
          type: 'IMAGE',
          mutability: 'IMMUTABLE',
          data: {
            src: element.getAttribute('src'),
            alt: element.getAttribute('alt')
          }
        }
      }
    }

    if (blockType != null) block = { ...block, type: blockType }

    if (this.customParseBlock != null) {
      const parsedBlock = this.customParseBlock(element)
      if (parsedBlock != null) {
        block = { ...block, ...parsedBlock }
      }
    }

    if (Object.keys(block).length === 0) {
      return null
    }

    return block
  }

  addInlineStyleRange = inlineStyleRange => {
    const lastBlock = this.content.blocks[this.content.blocks.length - 1]

    if (lastBlock.inlineStyleRanges == null) {
      lastBlock.inlineStyleRanges = []
    }

    lastBlock.inlineStyleRanges.push(inlineStyleRange)
  }

  addEntityRange = entity => {
    const lastBlock = this.content.blocks[this.content.blocks.length - 1]

    if (lastBlock.entityRanges == null) {
      lastBlock.entityRanges = []
    }

    lastBlock.entityRanges.push(entity)
  }

  traverseChildren = (node) => {
    Array.from(node.childNodes).forEach(element => {
      const parsedBlock = this.parseBlock(element)
      const parsedTextFragment = this.parseTextFragment(element)

      if (parsedBlock) {
        this.addBlock(parsedBlock)
      } else if (element.nodeName === '#text' && element.textContent != null) {
        this.addText(element.textContent)
      } else if (parsedTextFragment) {
        if (parsedTextFragment.inlineStyle != null) {
          this.addInlineStyleRange({
            style: parsedTextFragment.inlineStyle,
            offset: this.offset,
            length: element.textContent.length
          })
        }

        if (parsedTextFragment.entity != null) {
          this.addEntityRange({
            key: this.addEntity(parsedTextFragment.entity),
            offset: this.offset,
            length: element.textContent.length
          })
        }
      }

      if (element.childNodes != null && (parsedBlock == null || parsedBlock.type !== 'atomic')) { this.traverseChildren(element) }
    })
  }

  convert = (html) => {
    this.content = this.defaultContent
    const node = getSafeBodyFromHTML(html)
    this.traverseChildren(node)
    return this.content
  }
}

const convertFromHTML = (html: string, options?: { parseBlock?: Function, parseTextFragment?: Function }) => {
  const contentState = new RawDraftContent(options)
  return contentState.convert(html)
}

export default convertFromHTML
