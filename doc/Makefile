# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Requires: make, git, sed, and pandoc

# URL of the wiki repository containing the markdown files
REPO_URL := https://github.com/apache/daffodil-vscode.wiki.git

# Directory containing the wiki markdown files
SRC_DIR := .wiki/

# Filter out markdown files starting with underscore
SRC_MD = $(filter-out $(SRC_DIR)_%, $(wildcard $(SRC_DIR)*.md))

# List of docx and html files to generate from the markdown files
DOCX = $(addsuffix .docx, $(basename $(notdir $(SRC_MD))))
HTML = $(addsuffix .html, $(basename $(notdir $(SRC_MD))))

# Function to sanitize filenames
# 1. Replace non-alphanumeric (except dots and hyphens) with underscores
# 2. Replace consecutive underscores with a single underscore
# 3. Replace underscore followed by hyphen with just the hyphen
sanitize = $(shell echo $(1) | sed -e 's/[^a-zA-Z0-9.\-]/_/g' -e 's/__*/_/g' -e 's/_\-/-/g')

help:
	@echo "Available targets:"
	@echo "  all    - Clone/update the repo and generate docx and html files."
	@echo "  docx   - Generate docx files from the wiki markdown files."
	@echo "  html   - Generate html files from the wiki markdown files."
	@echo "  update - Pull updates from the wiki repository (markdown source repo)."
	@echo "  clean  - Remove generated docx, html files and the cloned wiki."

# Target to clone the git wiki repository containing the markdown files
$(SRC_DIR):
	@if ! git clone $(REPO_URL) $(SRC_DIR); then \
		echo "Failed to clone repository"; \
		exit 1; \
	fi

# Target to generate docx from md
%.docx: $(SRC_DIR)
	@# Convert img tags to markdown syntax for pandoc
	sed -r 's!<img[^>]* src="([^"]+)"[^>]*>!\![](\1)!g' "$(SRC_DIR)$(addsuffix .md,$(basename $@))" | pandoc -t docx -f gfm --resource-path=$(SRC_DIR) --toc=true -o "$(call sanitize,$@)" -

# Target to generate html from md
%.html: $(SRC_DIR)
	@# Convert img tags to markdown syntax for pandoc
	sed -r 's!<img[^>]* src="([^"]+)"[^>]*>!\![](\1)!g' "$(SRC_DIR)$(addsuffix .md,$(basename $@))" | pandoc -t html -f gfm --resource-path=$(SRC_DIR) --embed-resources --standalone --toc=true --metadata title="$(subst -, ,$(basename $@))" -o "$(call sanitize,$@)" -

# Target to update the wiki repository
update: $(SRC_DIR)
	@if ! git -C $(SRC_DIR) pull; then \
		echo "Failed to update the repository"; \
		exit 1; \
	fi

# Target to generate docx from md
docx: update
	@${MAKE} $(DOCX)

# Target to generate html from md
html: update
	@${MAKE} $(HTML)

# Main target to update the repo and then generate the documentation files
all: docx html

# Cleanup target
clean:
	rm -rf *.docx *.html $(SRC_DIR)

.DEFAULT_GOAL := help
.PHONY: help update docx html all clean

