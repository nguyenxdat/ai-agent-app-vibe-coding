#!/bin/bash
# Clean script cho AI Chat Project

set -e

echo "🧹 Bắt đầu dọn dẹp project..."

# Function để xóa folder an toàn
safe_remove() {
    if [ -d "$1" ] || [ -f "$1" ]; then
        echo "  ❌ Xóa: $1"
        rm -rf "$1"
    fi
}

# Xóa node_modules
echo ""
echo "📦 Xóa dependencies..."
safe_remove "node_modules"
safe_remove "web/node_modules"
safe_remove "desktop/node_modules"
safe_remove "shared/node_modules"

# Xóa Python venv
echo ""
echo "🐍 Xóa Python virtual environment..."
safe_remove "backend/venv"
safe_remove "backend/env"
safe_remove "backend/.venv"

# Xóa build outputs
echo ""
echo "🏗️  Xóa build outputs..."
safe_remove "web/dist"
safe_remove "web/dist-ssr"
safe_remove "desktop/dist"
safe_remove "desktop/build"
safe_remove "desktop/out"
safe_remove "shared/dist"
safe_remove "backend/dist"
safe_remove "backend/build"

# Xóa Python cache
echo ""
echo "🐍 Xóa Python cache..."
find backend -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find backend -type f -name "*.pyc" -delete 2>/dev/null || true
find backend -type f -name "*.pyo" -delete 2>/dev/null || true
safe_remove "backend/.pytest_cache"
safe_remove "backend/.coverage"
safe_remove "backend/htmlcov"
safe_remove "backend/.tox"

# Xóa TypeScript build info
echo ""
echo "📘 Xóa TypeScript cache..."
find . -type f -name "*.tsbuildinfo" -delete 2>/dev/null || true

# Xóa cache files
echo ""
echo "💾 Xóa cache files..."
safe_remove ".vite"
safe_remove "web/.vite"
safe_remove "desktop/.vite"
safe_remove ".eslintcache"
safe_remove ".turbo"
safe_remove ".next"

# Xóa logs
echo ""
echo "📝 Xóa log files..."
find . -type f -name "*.log" -delete 2>/dev/null || true
safe_remove "logs"

# Xóa OS files
echo ""
echo "💻 Xóa OS files..."
find . -type f -name ".DS_Store" -delete 2>/dev/null || true
find . -type f -name "Thumbs.db" -delete 2>/dev/null || true

# Xóa coverage
echo ""
echo "📊 Xóa coverage files..."
safe_remove "coverage"
safe_remove ".nyc_output"
safe_remove "web/coverage"
safe_remove "desktop/coverage"

echo ""
echo "✅ Dọn dẹp hoàn tất!"
echo ""
echo "📌 Để cài lại dependencies, chạy:"
echo "   npm install (cho frontend)"
echo "   cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt (cho backend)"
