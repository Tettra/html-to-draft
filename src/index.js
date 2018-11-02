// @flow

import getSafeBodyFromHTML from 'draft-js/lib/getSafeBodyFromHTML'

const blockTypes = {
  'H1': 'header-one',
  'H2': 'header-two',
  'H3': 'header-three',
  'H4': 'header-four',
  'H5': 'header-five',
  'H6': 'header-six',
  'IMG': 'image',
  'LI': 'unordered-list-item',
  'BLOCKQUOTE': 'blockquote',
  'PRE': 'code-block',
  'CODE': 'code-block',
  'DIV': 'unstyled',
  'P': 'unstyled',
  'IMG': 'atomic'
}

const textDecorations = {
  underline: 'UNDERLINE',
  'line-through': 'STRIKETHROUGH'
}

const boldValues = ['bold', 'bolder', '500', '600', '700', '800', '900'];

const inlineStyleTags = {
  b: 'BOLD',
  code: 'CODE',
  del: 'STRIKETHROUGH',
  em: 'ITALIC',
  i: 'ITALIC',
  s: 'STRIKETHROUGH',
  strike: 'STRIKETHROUGH',
  strong: 'BOLD',
  u: 'UNDERLINE',
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

const inlineNodeNames = ['SPAN', 'A', 'EM', 'B', 'I']
const blockNodeNames = ['P', 'DIV']
const isBlock = element => {
  return Array.from(element.children).some(el => {
    return inlineNodeNames.includes(el.nodeName)
  }) && element.textContent.length > 0
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

class RawDraftContent {
  entityKey: number
  content: RawDraftContentState

  constructor(options) {
    this.entityKey = 0;
    if (options && options.parseBlock != null) {
      this.customParseBlock = options.parseBlock
    }
    if (options && options.parseTextFragment != null) {
      this.customParseTextFragment = options.parseTextFragment
    }
    this.content = this.defaultContent = { blocks: [], entityMap: {} }
  }

  addBlock = (block) => {
    const index = this.content.blocks.push(block)
    return this.content.blocks[index - 1]
  }

  addEntity = (entity: RawDraftEntity): string => {
    const key = this.entityKey
    this.content.entityMap[key.toString()] = entity
    this.entityKey+= 1
    return key.toString()
  }

  parseTextFragment = (element, offset = 0) => {
    let textFragment = null

    if (this.customParseTextFragment != null) {
      const parsedTextFragment = this.customParseTextFragment(element)
      if (parsedTextFragment != null) {
        textFragment = parsedTextFragment
      }
    }

    if (textFragment == null) {
      const inlineStyle = inlineStyleTags[element.nodeName.toLowerCase()]
      const fontWeight = element.style.fontWeight
      const textDecoration = element.style.textDecoration
      const fontStyle = element.style.fontStyle

      if (inlineStyle != null) {
        textFragment = { inlineStyle }
      }

      if (inlineStyle == null && boldValues.includes(fontWeight)) {
        textFragment = { inlineStyle: 'BOLD' }
      } else if (inlineStyle == null && fontStyle === 'italic') {
        textFragment = { inlineStyle: 'ITALIC' }
      } else if (inlineStyle == null && textDecorations[textDecoration] != null) {
        textFragment = { inlineStyle: textDecorations[textDecoration] }
      }
    }

    return textFragment
  }

  parseBlock = (element) => {
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
            src: element,
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

    return block
  }

  traverseInlineElement = (block, element, offset = 0) => {
    let parsedTextFragment = this.parseTextFragment(element, offset)
    if (parsedTextFragment != null) {
      parsedTextFragment = { ...parsedTextFragment }

      if (parsedTextFragment.inlineStyle != null) {
        block.inlineStyleRanges.push({
          style: parsedTextFragment.inlineStyle,
          offset,
          length: element.textContent.length
        })
      }

      if (parsedTextFragment.entity != null) {
        block.entityRanges.push({
          key: this.addEntity(parsedTextFragment.entity),
          offset,
          length: element.textContent.length
        })
      }
    }

    Array.from(element.children).reduce((index, child) => {
      this.traverseInlineElement(block, child, index)
      return child.textContent.length + index
    }, offset)
  }

  traverseBlock = (element) => {
    let block = {}

    const { entity, ...parsedBlock } = this.parseBlock(element)

    if (parsedBlock != null) {
      block = {
        ...parsedBlock,
        inlineStyleRanges: [],
        entityRanges: [],
      }
    }

    block = {
      ...block,
      text: block.type == null || block.type.toLowerCase() !== 'atomic' ? element.textContent : ' '
    }

    if (entity != null && block.type === 'atomic') {
      block.entityRanges.push({
        key: this.addEntity(entity),
        offset: 0,
        length: 1
      })
    }

    const newBlock = this.addBlock({
      ...block,
    })

    const startIndex = 0

    Array.from(element.children).reduce((index, child) => {
      this.traverseInlineElement(newBlock, child, index)
      return index + child.textContent.length
    }, startIndex)
  }

  traverseChildren = (node) => {
    Array.from(node.children).forEach(element => {
      if (isBlock(element)) {
        this.traverseBlock(element)
      } else {
        const parsedBlock = this.parseBlock(element)

        if (parsedBlock.type != null) {
          this.traverseBlock(element)
        } else {
          this.traverseChildren(element)
        }
      }
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
  console.log('convert from html')
  const contentState = new RawDraftContent(options)
  return contentState.convert(html)
}

export default convertFromHTML
