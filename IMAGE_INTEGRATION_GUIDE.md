# Image Integration Guide

## Quick Steps

1. **Copy image to client/public/**
   ```bash
   cp "user/provided/path/image.png" "client/public/new-name.png"
   ```

2. **Reference in code**
   ```jsx
   <img src="new-name.png" alt="Description" />
   ```

3. **Verify**
   ```bash
   ls -la client/public/new-name.png
   ```

## Key Rules
- Images go in `client/public/` (NOT root `public/`)
- Use filename only in src (no paths)
- Use kebab-case names
- Always test display

## Common Fix
If image doesn't show → check it's in `client/public/` and src uses filename only.