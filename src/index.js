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
  'P': 'unstyled'
}

const isTwitterEmoji = element => element.nodeName === 'IMG' && element.className === 'Emoji Emoji--forText'
const isPaperEmoji = element => element.nodeName === 'IMG' && element.dataset && element.dataset.hasOwnProperty('emojiCh')

const countParents = (el, match, count = 0) => {
  if (el.parentElement != null) {
    if (match(el.parentElement)) count++
    return countParents(el.parentElement, match, count);
  } else {
    return count;
  }
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
  inlineStyleRanges: ?Array<string>,
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
    let textFragment = { }

    const inlineStyle = inlineStyleTags[element.nodeName.toLowerCase()]
    const fontWeight = element.style && element.style.fontWeight
    const textDecoration = element.style && element.style.textDecoration
    const fontStyle = element.style && element.style.fontStyle
    const fontFamily = element.style && element.style.fontFamily

    const inlineStyleRanges = []

    if (inlineStyle != null) {
      inlineStyleRanges.push(inlineStyle)
    }

    if (boldValues.includes(fontWeight)) {
      inlineStyleRanges.push('BOLD')
    }

    if (fontStyle === 'italic') {
      inlineStyleRanges.push('ITALIC')
    }

    if (textDecorations[textDecoration] != null) {
      inlineStyleRanges.push(textDecorations[textDecoration])
    }

    if (fontFamily === 'monospace') {
      inlineStyleRanges.push('CODE')
    }

    textFragment = {
      ...textFragment,
      inlineStyleRanges,
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

    if (this.customParseTextFragment != null) {
      const parsedTextFragment = this.customParseTextFragment(element)
      if (parsedTextFragment != null) {
        textFragment = {
          ...textFragment,
          parsedTextFragment,
          inlineStyleRanges: [
            ...textFragment.inlineStyleRnages,
            ...parsedTextFragment.inlineStyleRanges
          ]
        }
      }
    }

    return textFragment
  }

  parseBlock = (element): Block => {
    let blockType = blockTypes[element.nodeName]
    const lastBlock = this.content.blocks[this.content.blocks.length - 1]
    let block = { }

    // Some editors use DIV instead of P nodes, this will prevent bunching all text into
    // one unstyled block
    if (element.nodeName === 'DIV' && lastBlock && lastBlock.text.length > 0) {
      this.addBlock({ type: 'unstyled' })
    }

    // This is for paper code blocks
    if (element.nodeName === 'CODE' && element.parentElement.textContent.length === element.textContent.length) {
      blockType = 'code-block'
    }

    if (element.parentElement.nodeName === 'LI') {
      return null
    }

    if (element.nodeName === 'LI' && element.parentNode.nodeName === 'OL') {
      blockType = 'ordered-list-item'
    }

    if (element.nodeName === 'LI') {
      const depth = countParents(element, el => ['UL', 'OL'].includes(el.nodeName)) - 1
      block = {
        depth: depth > 0 ? depth : 0
      }
    }

    if (isTwitterEmoji(element)) {
      this.addText(element.getAttribute('alt'))
    } else if (isPaperEmoji(element)) {
      this.addText(element.dataset.emojiCh)
    } else if (element.nodeName === 'IMG') {
      block = {
        type: 'atomic',
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

  addInlineStyleRanges = inlineStyleRanges => {
    const lastBlock = this.content.blocks[this.content.blocks.length - 1]

    if (lastBlock.inlineStyleRanges == null) {
      lastBlock.inlineStyleRanges = []
    }

    lastBlock.inlineStyleRanges = lastBlock.inlineStyleRanges.concat(inlineStyleRanges)
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
        if (parsedTextFragment.inlineStyleRanges != null) {
          this.addInlineStyleRanges(parsedTextFragment.inlineStyleRanges.map(style => ({
            style,
            offset: this.offset,
            length: element.textContent.length
          })))
        }

        if (parsedTextFragment.entity != null) {
          this.addEntityRange({
            key: this.addEntity(parsedTextFragment.entity),
            offset: this.offset,
            length: element.textContent.length
          })
        }
      }

      if (element.childNodes != null && (parsedBlock == null || parsedBlock.type !== 'atomic')) {
        this.traverseChildren(element)
      }
    })
  }

  groupCodeBlocks = () => {
    this.content.blocks = this.content.blocks.reduce((acc, block) => {
      const blocks = acc.slice(0, -1)
      const lastBlock = acc.slice(-1)[0]

      if (block.type === 'code-block' && lastBlock != null && lastBlock.type === 'code-block') {
        return [...blocks, {
          ...lastBlock,
          text: lastBlock.text + '\n' + block.text
        }]
      } else {
        return [...acc, block]
      }
    }, [])
  }

  convert = (html) => {
    this.content = this.defaultContent
    const node = getSafeBodyFromHTML(html)
    this.traverseChildren(node)
    this.groupCodeBlocks()
    return this.content
  }
}

const convertFromHTML = (html: string, options?: { parseBlock?: Function, parseTextFragment?: Function }) => {
  const contentState = new RawDraftContent(options)
  return contentState.convert(html)
}

export default convertFromHTML
