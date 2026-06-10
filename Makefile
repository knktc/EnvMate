NAME := envmate
VERSION := $(shell sed -nE 's/.*"version":[[:space:]]*"([^"]+)".*/\1/p' manifest.json | head -n 1)
DIST_DIR := dist
ZIP_FILE := $(DIST_DIR)/$(NAME)-$(VERSION).zip
CRX_FILE := $(DIST_DIR)/$(NAME)-$(VERSION).crx
KEYS_DIR := .keys
GENERATED_KEY_FILE := $(KEYS_DIR)/$(NAME)-$(VERSION).pem
STAGE_ROOT := $(DIST_DIR)/stage
ZIP_STAGE_DIR := $(STAGE_ROOT)/zip-$(NAME)-$(VERSION)
CRX_STAGE_DIR := $(STAGE_ROOT)/crx-$(NAME)-$(VERSION)
CHROME ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
KEY ?=
PACKAGE_CONTENTS := manifest.json _locales assets options popup src

.PHONY: help stage zip crx clean

help:
	@echo "Targets:"
	@echo "  make zip              Build $(ZIP_FILE) for store/manual release"
	@echo "  make crx              Build $(CRX_FILE) with Chrome CLI"
	@echo "  make crx KEY=key.pem  Reuse an existing PEM private key"
	@echo "  make clean            Remove build artifacts"

$(DIST_DIR):
	@mkdir -p "$(DIST_DIR)"

$(KEYS_DIR):
	@mkdir -p "$(KEYS_DIR)"

stage: $(DIST_DIR)
	@rm -rf "$(ZIP_STAGE_DIR)" "$(CRX_STAGE_DIR)"
	@mkdir -p "$(ZIP_STAGE_DIR)" "$(CRX_STAGE_DIR)"
	@for item in $(PACKAGE_CONTENTS); do cp -R "$$item" "$(ZIP_STAGE_DIR)/$$item"; cp -R "$$item" "$(CRX_STAGE_DIR)/$$item"; done
	@find "$(ZIP_STAGE_DIR)" "$(CRX_STAGE_DIR)" \( -name '.DS_Store' -o -name '__MACOSX' \) -print0 | xargs -0 rm -rf
	@echo "Staged extension files in $(ZIP_STAGE_DIR) and $(CRX_STAGE_DIR)"

zip: stage
	@rm -f "$(ZIP_FILE)"
	@cd "$(ZIP_STAGE_DIR)" && zip -qr "$(abspath $(ZIP_FILE))" .
	@echo "Built $(ZIP_FILE)"

crx: stage $(KEYS_DIR)
	@test -x "$(CHROME)" || { echo "Chrome executable not found at $(CHROME)"; exit 1; }
	@rm -f "$(abspath $(CRX_STAGE_DIR)).crx" "$(abspath $(CRX_STAGE_DIR)).pem" "$(CRX_FILE)"
	@if [ -n "$(KEY)" ]; then \
		test -f "$(KEY)" || { echo "Key file not found: $(KEY)"; exit 1; }; \
		"$(CHROME)" --pack-extension="$(abspath $(CRX_STAGE_DIR))" --pack-extension-key="$(abspath $(KEY))"; \
	else \
		echo "No KEY supplied; Chrome will generate a new PEM private key."; \
		"$(CHROME)" --pack-extension="$(abspath $(CRX_STAGE_DIR))"; \
	fi
	@mv -f "$(abspath $(CRX_STAGE_DIR)).crx" "$(CRX_FILE)"
	@if [ -f "$(abspath $(CRX_STAGE_DIR)).pem" ]; then rm -f "$(GENERATED_KEY_FILE)"; mv -f "$(abspath $(CRX_STAGE_DIR)).pem" "$(GENERATED_KEY_FILE)"; fi
	@echo "Built $(CRX_FILE)"
	@if [ -f "$(GENERATED_KEY_FILE)" ]; then echo "Generated signing key at $(GENERATED_KEY_FILE)"; fi

clean:
	@rm -rf "$(DIST_DIR)"
	@echo "Removed $(DIST_DIR)"
