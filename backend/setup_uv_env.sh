#!/bin/bash

# StudyLoop Backend Setup with uv virtual environment

set -e

cd "$(dirname "$0")"

echo "🚀 StudyLoop Backend Setup with uv Virtual Environment"
echo "============================================================"

# Check if uv is available
if ! command -v uv &> /dev/null; then
    echo "❌ uv not found. Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.cargo/bin/uv-realpath
fi

echo "✅ uv is available: $(uv --version)"

# Check if pyproject.toml exists
if [ ! -f "pyproject.toml" ]; then
    echo "❌ pyproject.toml not found. Please run this script from the project root."
    exit 1
fi

echo "✅ pyproject.toml found"

# Create virtual environment
echo "🔧 Creating virtual environment..."
if [ ! -d ".venv" ]; then
    uv venv .venv
    echo "✅ Virtual environment created: .venv"
else
    echo "⚠️  Virtual environment already exists: .venv"
fi

# Activate virtual environment
source .venv/bin/activate

echo "✅ Virtual environment activated"

# Install project in development mode
echo "📦 Installing project dependencies..."
uv sync

echo "✅ Dependencies installed successfully"

# Create .env file from template if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.template" ]; then
        cp .env.template .env
        echo "✅ Created .env from .env.template"
        echo "⚠️  Please edit .env with your configuration values"
    else
        echo "⚠️  No .env.template found. Creating basic .env..."
        cat > .env << EOF
# StudyLoop Backend Configuration

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Database
DATABASE_URL=sqlite:///./studyloop.db

# Security
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI Integration
# ~4B model sized for reliable structured output without being heavy on
# local machines. Finish pulling it with:  ollama pull gemma3:4b
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=Qwen2.5-Coder

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# AI Integration (for future phases)
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama2
EOF
        echo "✅ Created basic .env file"
    fi
fi

echo "✅ Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Activate the virtual environment:"
echo "   source .venv/bin/activate"
echo ""
echo "2. Start the backend server:"
echo "   uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload"
echo ""
echo "3. Run Phase 1 verification tests:"
echo "   python run_tests.py"
echo ""
echo "============================================================"