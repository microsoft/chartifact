# YouTube Plugin Test

## YouTube Plugin (uses iframe under the hood)

The iframe plugin is not registered directly - it's used as a utility by platform-specific plugins.

### Simple URL (LLM/casual friendly)
```json youtube
{
    "url": "https://youtu.be/zB3lrLjqIh4"
}
```

### Advanced JSON (power users)
```json youtube
{
    "url": "https://www.youtube.com/watch?v=zB3lrLjqIh4",
    "width": 800,
    "height": 450,
    "start": 44,
    "autoplay": false,
    "controls": true,
    "modestbranding": true
}
```

### Raw HTML (copy-paste from YouTube)
```html youtube
<iframe width="560" height="315" src="https://www.youtube.com/embed/zB3lrLjqIh4?si=u9ShC2rU1Jk4pG89&amp;start=44" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
```

## Different YouTube URL Formats Should All Work

### Share URL
```json youtube
{
    "url": "https://youtu.be/zB3lrLjqIh4?si=u9ShC2rU1Jk4pG89"
}
```

### Watch URL
```json youtube
{
    "url": "https://www.youtube.com/watch?v=zB3lrLjqIh4"
}
```

### Embed URL
```json youtube
{
    "url": "https://www.youtube.com/embed/zB3lrLjqIh4?si=Y3HZreNKAQyfUe-v"
}
```

## Error Cases

### Invalid YouTube URL
```json youtube
{
    "url": "https://example.com/not-youtube"
}
```

### Missing URL
```json youtube
{
    "width": 560,
    "height": 315
}
```

## Future Platform Support

When we add more platforms (Vimeo, Twitch, etc.), they will also use the iframe plugin internally:

```json vimeo
{
    "url": "https://vimeo.com/123456789"
}
```

```json codepen
{
    "url": "https://codepen.io/user/pen/abcdef"
}
```
