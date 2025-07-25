# Google Fonts Demo

This document demonstrates the Google Fonts plugin with cascading font behavior and semantic mapping.

```json google-fonts
{
  "googleFontsUrl": "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Source+Code+Pro:wght@400;600&family=Inter:wght@300;400;500&family=Roboto+Slab:wght@400;700&display=swap",
  "mapping": {
    "body": "Inter",
    "hero": "Playfair Display",
    "headings": "Roboto Slab", 
    "code": "Source Code Pro"
  }
}
```

# Hero Headline Level 1
## Hero Headline Level 2
### Hero Headline Level 3

#### Regular Heading Level 4
##### Regular Heading Level 5
###### Regular Heading Level 6

This is regular paragraph text that demonstrates the body font. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

- This is a bulleted list item
- Another list item 
- Third item to show consistency

1. Numbered list item one
2. Second numbered item
3. Third numbered item

**Bold text** and *italic text* also inherit the body font.

Here's some `inline code` and a code block:

```javascript
// Code blocks use the code font mapping
function example() {
    console.log("Hello, World!");
}
```

## Tables

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Data A   | Data B   | Data C   |
| Numbers  | 123.45   | 678.90   |

This content lets you see how different fonts apply to different semantic elements without any distracting references to the font names.