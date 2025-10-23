#!/bin/bash

# AuditaAI - Quick Setup Script for Free Local Models
# Installs Ollama and pulls recommended demo models

set -e

echo "🚀 AuditaAI - Free Local Models Setup"
echo "======================================"
echo ""

# Check if Ollama is already installed
if command -v ollama &> /dev/null; then
    echo "✅ Ollama is already installed"
    ollama --version
else
    echo "📦 Installing Ollama..."
    echo ""
    
    # Detect OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🍎 Detected macOS"
        curl -fsSL https://ollama.ai/install.sh | sh
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "🐧 Detected Linux"
        curl -fsSL https://ollama.ai/install.sh | sh
    else
        echo "⚠️  Windows detected. Please download Ollama from:"
        echo "   https://ollama.ai/download"
        echo ""
        echo "Then run this script again to pull models."
        exit 0
    fi
    
    echo ""
    echo "✅ Ollama installed successfully!"
fi

echo ""
echo "📥 Pulling recommended demo models..."
echo ""

# Pull fast demo model (default)
echo "1️⃣  Pulling llama3.2:3b (1.9GB - fast & efficient)"
ollama pull llama3.2:3b

echo ""
read -p "💡 Pull additional models? (Mistral 7B - 4.7GB, good quality) [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "2️⃣  Pulling mistral:7b (4.7GB - high quality)"
    ollama pull mistral:7b
    
    echo ""
    read -p "💡 Pull Phi3 Medium? (4.7GB - balanced) [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "3️⃣  Pulling phi3:medium (4.7GB - balanced)"
        ollama pull phi3:medium
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🔍 Installed models:"
ollama list

echo ""
echo "🎯 Next Steps:"
echo "   1. Start Ollama:   ollama serve"
echo "   2. Start backend:  cd backend && npm run dev"
echo "   3. Start frontend: cd frontend && npm run dev"
echo "   4. Open browser:   http://localhost:3000"
echo ""
echo "💡 Tips:"
echo "   - Default model: llama3.2:3b (FREE, fast)"
echo "   - No API keys needed!"
echo "   - All data stays local"
echo "   - Perfect for demos without API costs"
echo ""
echo "📖 Full guide: see FREE_LOCAL_MODELS.md"
echo ""
echo "🎉 Happy testing!"
