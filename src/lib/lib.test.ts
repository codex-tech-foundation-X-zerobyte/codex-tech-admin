import { describe, expect, it } from 'vitest'
import { csvCell, toCsv } from './csv'
import { pageCount, rangeText } from './format'

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"')
    expect(csvCell('say "hi"')).toBe('"say ""hi"""')
    expect(csvCell('l1\nl2')).toBe('"l1\nl2"')
  })
  it('neutralises formula injection', () => {
    for (const bad of ['=SUM(1)', '+1', '-1', '@cmd', '\tx']) expect(csvCell(bad).startsWith("'") || csvCell(bad).startsWith('"\'')).toBe(true)
  })
  it('handles null and builds rows', () => {
    expect(csvCell(null)).toBe('')
    expect(toCsv(['a', 'b'], [[1, 'x,y']])).toBe('a,b\r\n1,"x,y"\r\n')
  })
})

describe('format', () => {
  it('computes page counts', () => {
    expect(pageCount(0, 25)).toBe(1)
    expect(pageCount(1284, 25)).toBe(52)
  })
  it('describes the visible range', () => {
    expect(rangeText(0, 1, 25)).toBe('No results')
    expect(rangeText(1284, 1, 25)).toBe('Showing 1 to 25 of 1,284')
    expect(rangeText(30, 2, 25)).toBe('Showing 26 to 30 of 30')
  })
})
