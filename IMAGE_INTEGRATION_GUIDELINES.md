# Image Integration Guidelines for OrganicSoilWholesale

## Overview
This document provides step-by-step instructions for properly integrating images from any source (downloads, screenshots, etc.) into the web application for proper display and deployment.

## The Problem We Solved
Images must be stored locally within the application files (not external URLs) to ensure:
- Proper deployment across all environments
- Self-contained application bundle
- Reliable image loading without external dependencies
- Version control tracking of all assets

## Step-by-Step Process

### 1. Image Source Location
- Images can come from anywhere: `/Users/username/Downloads/`, screenshots, etc.
- Always use the exact path provided by the user

### 2. Destination Directory
**CRITICAL**: Images must go in the `client/public/` directory
- **Correct Path**: `/path/to/project/client/public/`
- **NOT**: `/path/to/project/public/` (root public folder)

### 3. File Naming Convention
- Use kebab-case (lowercase with hyphens)
- Be descriptive but concise
- Example: `plant-pal-showcase.png`, `product-hero-image.jpg`

### 4. Copy Command Template
```bash
cp "source/path/with spaces/image.png" "client/public/descriptive-name.png"
```

### 5. HTML/React Reference
- Use just the filename (no path prefix)
- **Correct**: `src="image-name.png"`
- **Incorrect**: `src="/images/image-name.png"` or `src="public/image-name.png"`

## Example Workflow

### User provides image:
```
'/Users/rodolfoalvarez/Downloads/product showcase.png'
```

### Steps to integrate:
1. **Copy to correct location:**
   ```bash
   cp "/Users/rodolfoalvarez/Downloads/product showcase.png" "client/public/product-showcase.png"
   ```

2. **Reference in code:**
   ```jsx
   <img src="product-showcase.png" alt="Product Showcase" />
   ```

3. **Verify placement:**
   ```bash
   ls -la client/public/
   # Should show: product-showcase.png
   ```

## Troubleshooting

### Image not displaying?
1. **Check file location**: Must be in `client/public/` not root `public/`
2. **Check path in code**: Use filename only, no directory prefixes
3. **Check file exists**: `ls -la client/public/your-image.png`
4. **Check for typos**: Filename in code must match actual filename exactly

### Development vs Production
- This method works for both development and production deployments
- Vite serves files from `client/public/` at the root URL path
- No additional configuration needed

## Directory Structure
```
project-root/
├── client/
│   ├── public/           ← Images go here
│   │   ├── image1.png
│   │   ├── image2.jpg
│   │   └── robots.txt
│   └── src/
└── public/              ← NOT here (wrong location)
```

## Best Practices
1. **Always test**: Verify image displays after integration
2. **Descriptive names**: Use meaningful filenames
3. **Optimize images**: Compress large images before integration
4. **Version control**: Commit images with the code changes
5. **Self-contained**: Never rely on external image URLs for core app images

## Common Mistakes to Avoid
- ❌ Putting images in root `public/` folder
- ❌ Using full paths like `/images/` or `/public/`
- ❌ Forgetting to copy the image file
- ❌ Typos in filename references
- ❌ Using external URLs for app-critical images

---
*This process ensures 100% reliable image display in all deployment environments.*