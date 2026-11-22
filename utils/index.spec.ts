import { removeEmojis } from './index'

describe('removeEmojis', () => {
  it('should remove emojis from text', () => {
    expect(removeEmojis('🚀 Project Launch Plan 🎯')).toBe('Project Launch Plan')
    expect(removeEmojis('🔥 Hot Topic 🔥')).toBe('Hot Topic')
    expect(removeEmojis('✨ Magic Feature ✨')).toBe('Magic Feature')
  })

  it('should handle text without emojis', () => {
    expect(removeEmojis('Regular text')).toBe('Regular text')
    expect(removeEmojis('Numbers 123 and symbols #@$')).toBe('Numbers 123 and symbols #@$')
  })

  it('should handle empty or null input', () => {
    expect(removeEmojis('')).toBe('')
    expect(removeEmojis(null as any)).toBe(null)
    expect(removeEmojis(undefined as any)).toBe(undefined)
  })

  it('should handle mixed emoji and text', () => {
    expect(removeEmojis('💡 Idea: Implement new feature 🎉')).toBe('Idea: Implement new feature')
    expect(removeEmojis('🎨 Design: Color scheme 🖌️')).toBe('Design: Color scheme')
  })

  it('should handle complex emojis', () => {
    expect(removeEmojis('👨‍💻 Developer Team 👩‍💻')).toBe('Developer Team')
    expect(removeEmojis('🇯🇵 Japan 🇺🇸 USA')).toBe('Japan USA')
  })
})
