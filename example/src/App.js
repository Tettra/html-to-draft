// @flow

import React, { Component } from 'react'

import convertFromHtml from 'html-to-draft'
import { Editor, EditorState, convertFromRaw, convertToRaw } from 'draft-js'
import 'draft-js/dist/Draft.css'
import example from './example'

const parseBlock = (element) => {
  if (element.nodeName === 'BR') {
    return {
      type: 'unstyled'
    }
  }

  return null
}

export default class App extends Component {
  state = {
    editorState: EditorState.createEmpty()
  }

  render () {
    // console.log(convertToRaw(this.state.editorState.getCurrentContent()))
    return (
      <div>
        <Editor
          handlePastedText={(text, html) => {
            if (html) {
              console.log(html)
              console.log('converterd', convertFromHtml(html, { parseBlock }))
              this.setState({ editorState: EditorState.push(this.state.editorState, convertFromRaw(convertFromHtml(html, { parseBlock }))) });
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
