import convertFromHtml from '../'
import imgHtml from '../../__mocks__/image'
import richTextWithHeadersHtml from '../../__mocks__/richTextWithHeaders'
import richTextWithHeadersAndLinksHtml from '../../__mocks__/richTextWithHeadersAndLinks'
import tableHtml from '../../__mocks__/table'
import orderedListHtml from '../../__mocks__/orderedList'
import unorderedListHtml from '../../__mocks__/unorderedList'
import inlineCodeHtml from '../../__mocks__/inlineCode'
import codeBlockPaperHtml from '../../__mocks__/codeBlockPaper'
import githubCodeBlockHtml from '../../__mocks__/githubCodeBlock'
import unorderedListWithLinksFromGithubHtml from '../../__mocks__/unorderedListWithLinksFromGithub'

import nestedBulletsGoogleDocs from '../../__mocks__/nestedBulletsGoogleDocs'
import nestedOrderedListsGoogleDocs from '../../__mocks__/nestedOrderedListsGoogleDocs'
import nestedBulletsPaperCom from '../../__mocks__/nestedBulletsPaperCom'
import nestedOrdererdListsPaper from '../../__mocks__/nestedOrdererdListsPaper'

/*
 * Custom table implementation
 */
const parseRows = (element, rows = []) => {
  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeName === 'TR') {
      rows.push([])
    }

    if (child.nodeName === 'TD') {
      rows[rows.length - 1].push(convertHtml(child.innerHTML))
    } else {
      parseRows(child, rows)
    }
  })

  return rows
}

const parseBlock = (element) => {
  if (element.nodeName === 'BR') {
    return {
      type: 'unstyled'
    }
  }

  if (element.nodeName === 'TABLE') {
    return {
      type: 'atomic',
      entity: {
        type: 'TABLE',
        mutability: 'IMMUTABLE',
        data: {
          rows: parseRows(element)
        }
      }
    }
  }

  return null
}

const convertHtml = html => convertFromHtml(html, { parseBlock })

describe('convertFromHtml', () => {
  test('converts table', () => expect(convertHtml(tableHtml)).toMatchSnapshot())
  test('converts image', () => expect(convertHtml(imgHtml)).toMatchSnapshot())
  test('converts rich text with headers', () => expect(convertHtml(richTextWithHeadersHtml)).toMatchSnapshot())
  test('converts rich text with headers and links', () => expect(convertHtml(richTextWithHeadersAndLinksHtml)).toMatchSnapshot())
  test('converts unordered lists', () => expect(convertHtml(unorderedListHtml)).toMatchSnapshot())
  test('converts ordered lists', () => expect(convertHtml(orderedListHtml)).toMatchSnapshot())
  test('converts inline code', () => expect(convertHtml(inlineCodeHtml)).toMatchSnapshot())
  test('converts code blocks from github', () => expect(convertHtml(githubCodeBlockHtml)).toMatchSnapshot())
  test('converts code blocks from dropbox paper', () => expect(convertHtml(codeBlockPaperHtml)).toMatchSnapshot())
  test('converts unordered list with links from github', () => expect(convertHtml(unorderedListWithLinksFromGithubHtml)).toMatchSnapshot())
  test('converts nested bullet list from google docs', () => expect(convertHtml(nestedBulletsGoogleDocs)).toMatchSnapshot())
  test('converts nested ordered list from google docs', () => expect(convertHtml(nestedOrderedListsGoogleDocs)).toMatchSnapshot())
  test('converts nested bullet list from paper', () => expect(convertHtml(nestedBulletsPaperCom)).toMatchSnapshot())
  test('converts nested ordered list from paper', () => expect(convertHtml(nestedOrdererdListsPaper)).toMatchSnapshot())
})
