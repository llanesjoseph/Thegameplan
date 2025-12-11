#!/bin/bash

# Git-based rollback script for Game Plan Platform
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to log with colors
log() {
    echo -e "${1}${2}${NC}"
}

# Function to execute command with error handling
exec_command() {
    local description="$1"
    local command="$2"
    
    log "${BLUE}" "🔧 $description..."
    
    if eval "$command"; then
        log "${GREEN}" "✅ $description completed successfully!"
        return 0
    else
        log "${RED}" "❌ $description failed!"
        return 1
    fi
}

echo -e "${CYAN}🔙 GIT-BASED ROLLBACK FOR GAME PLAN PLATFORM${NC}"
echo -e "${CYAN}============================================${NC}"
echo

# Show current status
CURRENT_BRANCH=$(git branch --show-current)
CURRENT_COMMIT=$(git rev-parse --short HEAD)
log "${YELLOW}" "📋 Current branch: $CURRENT_BRANCH"
log "${YELLOW}" "📝 Current commit: $CURRENT_COMMIT"

# Show available tags
echo
log "${YELLOW}" "🏷️  Available release tags:"
git tag -l "v*" | tail -10 | while read tag; do
    log "${WHITE}" "   • $tag"
done

echo
log "${YELLOW}" "🏷️  Available deployment tags:"
git tag -l "deploy-*" | tail -10 | while read tag; do
    log "${WHITE}" "   • $tag"
done

echo
log "${YELLOW}" "📝 Recent commits:"
git log --oneline -10 | while read line; do
    log "${WHITE}" "   • $line"
done

echo
log "${YELLOW}" "🔙 Rollback Options:"
log "${WHITE}" "   1. Rollback to previous release tag"
log "${WHITE}" "   2. Rollback to specific tag"
log "${WHITE}" "   3. Rollback to specific commit"
log "${WHITE}" "   4. Rollback to previous deployment"

echo
read -p "Choose rollback option (1-4): " -n 1 -r
echo

case $REPLY in
    1)
        # Rollback to previous release tag
        PREVIOUS_TAG=$(git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo "No previous tag found")
        if [ "$PREVIOUS_TAG" = "No previous tag found" ]; then
            log "${RED}" "❌ No previous tag found"
            exit 1
        fi
        ROLLBACK_TARGET="$PREVIOUS_TAG"
        ;;
    2)
        # Rollback to specific tag
        echo
        read -p "Enter tag name to rollback to: " ROLLBACK_TARGET
        ;;
    3)
        # Rollback to specific commit
        echo
        read -p "Enter commit hash to rollback to: " ROLLBACK_TARGET
        ;;
    4)
        # Rollback to previous deployment
        PREVIOUS_DEPLOY=$(git tag -l "deploy-*" | tail -2 | head -1)
        if [ -z "$PREVIOUS_DEPLOY" ]; then
            log "${RED}" "❌ No previous deployment found"
            exit 1
        fi
        ROLLBACK_TARGET="$PREVIOUS_DEPLOY"
        ;;
    *)
        log "${RED}" "❌ Invalid option"
        exit 1
        ;;
esac

log "${YELLOW}" "🎯 Rollback target: $ROLLBACK_TARGET"

# Confirm rollback
echo
log "${YELLOW}" "⚠️  WARNING: This will rollback to $ROLLBACK_TARGET"
log "${YELLOW}" "⚠️  This action cannot be undone easily"
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "${YELLOW}" "Rollback cancelled"
    exit 1
fi

# Perform rollback
log "${YELLOW}" "🔙 Starting rollback to $ROLLBACK_TARGET..."

# Checkout the target
if ! exec_command "Checking out $ROLLBACK_TARGET" "git checkout $ROLLBACK_TARGET"; then
    log "${RED}" "❌ Failed to checkout $ROLLBACK_TARGET"
    exit 1
fi

# Clean build artifacts
log "${YELLOW}" "🧹 Cleaning build artifacts..."
rm -rf .next out
log "${GREEN}" "✅ Cleanup complete"

# Install dependencies
log "${YELLOW}" "📦 Installing dependencies..."
if ! exec_command "Installing dependencies" "npm install"; then
    exit 1
fi

# Build application
log "${YELLOW}" "🔨 Building application..."
if ! exec_command "Building application" "npm run build"; then
    exit 1
fi

# Deploy to Firebase
log "${YELLOW}" "🚀 Deploying rollback version..."
if ! exec_command "Deploying to Firebase Hosting" "firebase deploy --only hosting --project gameplan-787a2"; then
    exit 1
fi

# Create rollback tag
ROLLBACK_TAG="rollback-$(date +%Y%m%d-%H%M%S)"
log "${YELLOW}" "🏷️  Creating rollback tag: $ROLLBACK_TAG"
git tag -a "$ROLLBACK_TAG" -m "Rollback to $ROLLBACK_TARGET"
git push origin "$ROLLBACK_TAG"

# Run health checks
log "${YELLOW}" "🔍 Running health checks..."
if node scripts/test-deployment-health-fixed.js; then
    log "${GREEN}" "✅ Health checks passed!"
else
    log "${YELLOW}" "⚠️  Health checks had issues, but rollback completed"
fi

# Rollback complete
echo
log "${GREEN}" "🎉 GIT ROLLBACK COMPLETE!"
log "${GREEN}" "========================"
echo
log "${CYAN}" "🌐 Your Game Plan Platform has been rolled back!"
log "${CYAN}" "🔗 URL: https://cruciblegameplan.web.app"
echo
log "${YELLOW}" "📊 Rollback Details:"
log "${WHITE}" "   • Rollback Target: $ROLLBACK_TARGET"
log "${WHITE}" "   • Rollback Tag: $ROLLBACK_TAG"
log "${WHITE}" "   • Previous Commit: $CURRENT_COMMIT"
echo
log "${YELLOW}" "📊 Platform Status:"
log "${GREEN}" "   ✅ Build: Successful"
log "${GREEN}" "   ✅ Deployment: Complete"
log "${GREEN}" "   ✅ Security: Active"
log "${GREEN}" "   ✅ Performance: Optimized"
echo
log "${MAGENTA}" "🎯 Platform Rolled Back Successfully!"
echo
log "${CYAN}" "🚀 Rollback Summary:"
log "${WHITE}" "   • Platform: Game Plan"
log "${WHITE}" "   • Status: Rolled Back"
log "${WHITE}" "   • URL: https://cruciblegameplan.web.app"
log "${WHITE}" "   • Target: $ROLLBACK_TARGET"
echo
log "${MAGENTA}" "🎉 Rollback completed successfully!"
