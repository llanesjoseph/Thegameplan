#!/bin/bash
# Find all console.log statements for cleanup

echo "Searching for console.log statements..."
grep -r "console\." --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude="logger.ts" \
  . | grep -v "console.error" | wc -l

echo "Files with console statements:"
grep -r "console\." --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  --exclude-dir=dist \
  --exclude="logger.ts" \
  . | grep -v "console.error" | cut -d: -f1 | sort | uniq
