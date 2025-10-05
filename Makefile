.PHONY: build zip clean release test

# Get version from manifest.json
VERSION := $(shell grep '"version"' manifest.json | cut -d'"' -f4)
DATE := $(shell date +%Y%m%d-%H%M%S)
ZIP_NAME := chrome-pdf-ai-v$(VERSION)-$(DATE).zip

build:
	@echo "📦 Building Chrome PDF AI Extension..."
	@echo "Version: $(VERSION)"
	@mkdir -p dist

zip: build
	@echo "🗜️  Creating zip file..."
	@cd .. && zip -r chrome-pdf-ai/dist/$(ZIP_NAME) chrome-pdf-ai \
		-x 'chrome-pdf-ai/.git/*' \
		-x 'chrome-pdf-ai/.claude/*' \
		-x 'chrome-pdf-ai/node_modules/*' \
		-x 'chrome-pdf-ai/.DS_Store' \
		-x 'chrome-pdf-ai/IconKitchen-Output*/*' \
		-x 'chrome-pdf-ai/snapshot/*' \
		-x 'chrome-pdf-ai/*.md' \
		-x 'chrome-pdf-ai/*.zip' \
		-x 'chrome-pdf-ai/package*.json' \
		-x 'chrome-pdf-ai/Makefile' \
		-x 'chrome-pdf-ai/dist/*' \
		-x '*.git*'
	@echo "✅ Created: dist/$(ZIP_NAME)"
	@ls -lh dist/$(ZIP_NAME)

clean:
	@echo "🧹 Cleaning up..."
	@rm -rf dist/*.zip
	@echo "✅ Cleaned dist directory"

release: clean zip
	@echo ""
	@echo "🚀 Release package ready!"
	@echo "📦 File: dist/$(ZIP_NAME)"
	@echo "📏 Size: $$(du -h dist/$(ZIP_NAME) | cut -f1)"
	@echo ""
	@echo "Next steps:"
	@echo "1. Go to: https://chrome.google.com/webstore/devconsole"
	@echo "2. Upload: dist/$(ZIP_NAME)"
	@echo "3. Fill in store listing info from STORE_LISTING.md"

test:
	@echo "🧪 Testing extension structure..."
	@if [ ! -f "manifest.json" ]; then echo "❌ manifest.json not found"; exit 1; fi
	@if [ ! -f "background.js" ]; then echo "❌ background.js not found"; exit 1; fi
	@if [ ! -f "content-claude.js" ]; then echo "❌ content-claude.js not found"; exit 1; fi
	@if [ ! -f "content-chatgpt.js" ]; then echo "❌ content-chatgpt.js not found"; exit 1; fi
	@if [ ! -f "settings.html" ]; then echo "❌ settings.html not found"; exit 1; fi
	@if [ ! -f "settings.js" ]; then echo "❌ settings.js not found"; exit 1; fi
	@if [ ! -d "icons" ]; then echo "❌ icons directory not found"; exit 1; fi
	@if [ ! -f "icons/icon16.png" ]; then echo "❌ icon16.png not found"; exit 1; fi
	@if [ ! -f "icons/icon48.png" ]; then echo "❌ icon48.png not found"; exit 1; fi
	@if [ ! -f "icons/icon128.png" ]; then echo "❌ icon128.png not found"; exit 1; fi
	@echo "✅ All required files present"
	@echo "📋 Extension version: $(VERSION)"

help:
	@echo "Chrome PDF AI - Build Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  make build     - Create dist directory"
	@echo "  make zip       - Create zip file for Chrome Web Store"
	@echo "  make clean     - Remove all zip files from dist"
	@echo "  make release   - Clean, build, and create release package"
	@echo "  make test      - Test extension structure and files"
	@echo "  make help      - Show this help message"
	@echo ""
	@echo "Current version: $(VERSION)"
