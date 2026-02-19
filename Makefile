.PHONY: build zip clean release test

# Get version from manifest.json
VERSION := $(shell grep '"version"' manifest.json | cut -d'"' -f4)
DATE := $(shell date +%Y%m%d-%H%M%S)
ZIP_NAME := chrome-pdf-ai-v$(VERSION)-$(DATE).zip

bump-minor:
	@OLD=$$(grep '"version"' manifest.json | cut -d'"' -f4); \
	MAJOR=$$(echo $$OLD | cut -d. -f1); \
	MINOR=$$(echo $$OLD | cut -d. -f2); \
	NEW="$$MAJOR.$$((MINOR+1)).0"; \
	sed -i '' "s/\"version\": \"$$OLD\"/\"version\": \"$$NEW\"/" manifest.json; \
	echo "✅ Version: $$OLD → $$NEW"

build:
	@mkdir -p dist

zip: build
	@echo "🗜️  Creating zip..."
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
	@rm -rf dist/*.zip

release: bump-minor clean
	@$(MAKE) zip
	@echo ""
	@echo "🚀 Release ready!"
	@NEW_VER=$$(grep '"version"' manifest.json | cut -d'"' -f4); \
	echo "📦 dist/chrome-pdf-ai-v$$NEW_VER-$(DATE).zip"
	@echo ""
	@echo "Upload: https://chrome.google.com/webstore/devconsole"

test:
	@echo "🧪 Testing extension structure..."
	@if [ ! -f "manifest.json" ]; then echo "❌ manifest.json not found"; exit 1; fi
	@if [ ! -f "background.js" ]; then echo "❌ background.js not found"; exit 1; fi
	@if [ ! -f "popup.html" ]; then echo "❌ popup.html not found"; exit 1; fi
	@if [ ! -f "popup.js" ]; then echo "❌ popup.js not found"; exit 1; fi
	@if [ ! -f "content-claude.js" ]; then echo "❌ content-claude.js not found"; exit 1; fi
	@if [ ! -f "content-chatgpt.js" ]; then echo "❌ content-chatgpt.js not found"; exit 1; fi
	@if [ ! -f "content-youtube.js" ]; then echo "❌ content-youtube.js not found"; exit 1; fi
	@if [ ! -d "icons" ]; then echo "❌ icons directory not found"; exit 1; fi
	@echo "✅ All required files present"
	@echo "📋 Version: $(VERSION)"

help:
	@echo "make release  - Bump minor version, clean, build, zip"
	@echo "make test     - Validate required files"
	@echo "make clean    - Remove zip files from dist/"
	@echo ""
	@echo "Current version: $(VERSION)"
