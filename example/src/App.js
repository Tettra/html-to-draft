// @flow

import React, { Component } from 'react'

import ExampleComponent from 'html-to-draft'
import { Editor, EditorState, convertFromRaw } from 'draft-js'
import 'draft-js/dist/Draft.css'
import getSafeBodyFromHTML from 'draft-js/lib/getSafeBodyFromHTML'
import example from './example'

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
  'DIV': 'unstyled',
  'P': 'unstyled'
}

type RawDraftEntity = {
  type: string,
  mutability: 'MUTABLE' | 'IMMUTABLE' | 'SEGMENTED',
  data: ?{[key: string]: any},
};

type EntityRange = {
  key: number,
  offset: number,
  length: number,
};

type InlineStyleRange = {
  style: string,
  offset: number,
  length: number,
};

type RawDraftContentBlock = {
  type: ?string,
  text: string,
  depth: ?number,
  inlineStyleRanges: ?Array<InlineStyleRange>,
  entityRanges: ?Array<EntityRange>,
  data?: Object,
};

type RawDraftContentState = {
  blocks: Array<RawDraftContentBlock>,
  entityMap: {[key: string]: RawDraftEntity},
}

const inlineNodeNames = ['SPAN', 'A', 'EM', 'B', 'I']
const blockNodeNames = ['P', 'DIV']

const isBlock = element => Array.from(element.children).some(el => inlineNodeNames.includes(el.nodeName))

class RawDraftContent {
  entityKey: number
  content: RawDraftContentState

  constructor() {
    this.entityKey = 0;
    this.content = this.defaultContent = { blocks: [], entityMap: {} }
  }

  addBlock = (block) => {
    this.content.blocks.push(block)
    return this
  }

  addEntity = (entity: RawDraftEntity): string => {
    const key = this.entityKey
    this.entityMap[key] = entity.toString()
    this.entityKey+= 1
    return key.toString()
  }

  parseBlock = (element) => {
    let blockType = blockTypes[element.nodeName]

    if (element.nodeName === 'LI' && element.parentNode.nodeName === 'OL') {
      blockType = 'ordered-list-item'
    }

    if (blockType) {
      this.addBlock({
        type: blockType,
        text: element.textContent
      })
    }
  }

  parseChildren = (node) => {
    Array.from(node.children).forEach(element => {
      if (isBlock(element)) {
        this.parseBlock(element)
      } else {
        this.parseChildren(element)
      }
    })
  }

  convert = (html) => {
    this.content = this.defaultContent
    const node = getSafeBodyFromHTML(html)
    this.parseChildren(node)
    return this.content
  }
}

const convertFromHTML = (html) => {
  const contentState = new RawDraftContent()

  const raw = contentState.convert(html)
  return convertFromRaw(raw)
}

console.log('example', convertFromHTML(example))

export default class App extends Component {
  state = {
    editorState: EditorState.createEmpty()
  }

  render () {
    return (
      <div>
        <Editor
          handlePastedText={(text, html) => {
            if (html) {
              this.setState({ editorState: EditorState.push(this.state.editorState, convertFromHTML(html)) });
            }
            return 'handled'
          }}
          editorState={this.state.editorState}
          onChange={editorState => this.setState({ editorState })}
        />
      </div>
    )
  }
}
