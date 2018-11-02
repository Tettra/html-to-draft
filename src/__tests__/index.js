import convertFromHtml from '../'
import imgHtml from './__mocks__/image.txt'
import richTextWithHeadersHtml from './__mocks__/richTextWithHeaders.txt'
import richTextWithHeadersAndLinksHtml from './__mocks__/richTextWithHeadersAndLinks.txt'
import tableHtml from './__mocks__/table.txt'
import orderedListHtml from './__mocks__/orderedList.txt'
import unorderedListHtml from './__mocks__/unorderedList.txt'
import inlineCodeHtml from './__mocks__/inlineCode.txt'
import codeBlockPaperHtml from './__mocks__/codeBlockPaper.txt'
import githubCodeBlockHtml from './__mocks__/githubCodeBlock.txt'
import unorderedListWithLinksFromGithubHtml from './__mocks__/unorderedListWithLinksFromGithub.txt'

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
  test('converts unorderd list with links from github', () => expect(convertHtml(unorderedListWithLinksFromGithubHtml)).toMatchSnapshot())
})
