# Emoji Filtering in Conversation Titles

This document explains the emoji filtering functionality that prevents emojis from appearing in automatically generated conversation titles.

## Overview

By default, Dify API's automatic title generation may include emojis in conversation titles. This feature provides client-side filtering to remove emojis while preserving the meaningful text content.

## Configuration

### Environment Variable

You can control emoji filtering using the environment variable:

```bash
# .env.local
NEXT_PUBLIC_REMOVE_EMOJIS_FROM_TITLES=true  # Enable emoji filtering (default)
NEXT_PUBLIC_REMOVE_EMOJIS_FROM_TITLES=false # Disable emoji filtering
```

### Default Behavior

- **Enabled by default**: Emojis are automatically removed from generated titles
- **Configurable**: Can be disabled by setting the environment variable to `false`

## How It Works

1. **Title Generation**: When a conversation title is automatically generated via the Dify API
2. **Emoji Detection**: The system uses Unicode ranges to detect various emoji characters
3. **Filtering**: Emojis are removed while preserving text, numbers, and punctuation
4. **Clean Output**: The resulting title contains only meaningful text content

## Examples

### Before Filtering (Original API Response)
- `🚀 Project Launch Plan 🎯` 
- `📊 Data Analysis Report`
- `🎉 Celebration Time! 🎊`
- `👨‍💻 Developer working on 🖥️ computer`

### After Filtering (Displayed Title)
- `Project Launch Plan`
- `Data Analysis Report` 
- `Celebration Time!`
- `Developer working on computer`

## Technical Implementation

### Core Function
The `removeEmojis()` function in `/utils/index.ts` handles the emoji removal:

```typescript
export const removeEmojis = (text: string): string => {
  if (!text) return text
  
  // Unicode ranges for emojis and pictographic symbols
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1F018}-\u{1F270}]|[\u{238C}-\u{2454}]|[\u{20D0}-\u{20FF}]|[\u{FE0F}]|[\u{200D}]/gu
  
  return text.replace(emojiRegex, '').trim()
}
```

### Integration Point
The filtering is applied in the `generationConversationName()` function in `/service/share.ts`:

```typescript
export const generationConversationName = async (isInstalledApp: boolean, installedAppId = '', id: string) => {
  const result = await getAction('post', isInstalledApp)(getUrl(`conversations/${id}/name`, isInstalledApp, installedAppId), { body: { auto_generate: true } }) as Promise<ConversationItem>
  
  // Remove emojis from the generated conversation name if configured to do so
  if (result && result.name) {
    const { REMOVE_EMOJIS_FROM_TITLES } = await import('@/config')
    if (REMOVE_EMOJIS_FROM_TITLES) {
      const { removeEmojis } = await import('@/utils')
      result.name = removeEmojis(result.name)
    }
  }
  
  return result
}
```

## Unicode Ranges Covered

The emoji detection covers these Unicode ranges:

- **Emoticons**: `\u{1F600}-\u{1F64F}` (😀-🙏)
- **Miscellaneous Symbols**: `\u{1F300}-\u{1F5FF}` (🌀-🗿)  
- **Transport & Map**: `\u{1F680}-\u{1F6FF}` (🚀-🛿)
- **Regional Indicators**: `\u{1F1E0}-\u{1F1FF}` (🇠-🇿)
- **Miscellaneous Symbols**: `\u{2600}-\u{26FF}` (☀-⛿)
- **Dingbats**: `\u{2700}-\u{27BF}` (✀-➿)
- **Supplemental Symbols**: `\u{1F900}-\u{1F9FF}` (🤀-🧿)
- **Additional ranges** for modifiers and combining characters

## Testing

The functionality includes comprehensive tests in `/utils/index.spec.ts`:

```bash
npm test -- utils/index.spec.ts
```

Tests cover:
- Basic emoji removal
- Complex emoji sequences  
- Preservation of text and punctuation
- Handling of empty/null inputs
- Edge cases with emoji modifiers

## Alternative Approaches

### 1. Server-Side Configuration
If you have control over the Dify API configuration, you can potentially configure the title generation prompts to exclude emojis at the source.

### 2. Custom Title Generation
Instead of using auto-generation, implement custom title generation logic:

```typescript
// Example: Generate titles based on first few words of conversation
const generateCustomTitle = (conversationContent: string): string => {
  const words = conversationContent.trim().split(/\s+/).slice(0, 5)
  return words.join(' ')
}
```

### 3. Post-Processing Enhancement
Extend the filtering to handle additional cases:

```typescript
const enhancedTitleCleanup = (title: string): string => {
  return removeEmojis(title)
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/^[^\w]+|[^\w]+$/g, '') // Trim non-word characters
    .slice(0, 50)                   // Limit length
}
```

## Browser Compatibility

The emoji removal functionality works in all modern browsers that support:
- Unicode regular expressions (`u` flag)
- ES2018+ features

## Performance Considerations

- **Minimal overhead**: Regex operations are efficient for title-length strings
- **Async imports**: Configuration and utility functions are imported asynchronously
- **Client-side only**: No additional server requests required

## Troubleshooting

### Emojis Still Appearing
1. Check environment variable setting: `NEXT_PUBLIC_REMOVE_EMOJIS_FROM_TITLES=true`
2. Restart development server after changing environment variables
3. Verify the emoji characters are covered by the Unicode ranges

### Missing Text Content
1. Check if the original title contained only emojis
2. Review the regex pattern for potential over-matching
3. Test with the provided unit tests

## Future Enhancements

Potential improvements could include:

1. **Configurable replacement**: Replace emojis with descriptive text
2. **Smart filtering**: Keep emojis that add semantic meaning
3. **Fallback titles**: Generate alternative titles when emoji removal leaves empty strings
4. **Custom patterns**: Allow configuration of additional characters to filter