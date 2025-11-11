#!/bin/bash
# Governance Optimizer Runner
# Simplifies running either Anthropic or OpenAI optimization

set -e

cd "$(dirname "$0")" || exit 1

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    cat << EOF
${BLUE}GOVERNANCE BAYESIAN OPTIMIZER${NC}

Usage: $0 [OPTIONS]

OPTIONS:
    -m, --model MODEL       Model provider: 'anthropic' or 'openai' (default: openai)
    -b, --budget BUDGET     Budget in USD (default: 5.0)
    -n, --n-initial N       Initial random samples (default: 2)
    -w, --warm-start        Enable warm start with v2.x variants (default: enabled)
    --no-warm-start         Disable warm start
    -h, --help              Show this help message

EXAMPLES:
    # OpenAI optimization with \$5 budget
    $0 --model openai --budget 5

    # Anthropic optimization with \$50 budget
    $0 --model anthropic --budget 50

    # Quick test with 2 samples
    $0 --model openai --budget 5 --n-initial 2

    # Full exploration without warm-start
    $0 --model anthropic --budget 50 --n-initial 10 --no-warm-start

EOF
}

# Default values
MODEL="openai"
BUDGET="5.0"
N_INITIAL="2"
WARM_START="--warm-start"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--model)
            MODEL="$2"
            shift 2
            ;;
        -b|--budget)
            BUDGET="$2"
            shift 2
            ;;
        -n|--n-initial)
            N_INITIAL="$2"
            shift 2
            ;;
        -w|--warm-start)
            WARM_START="--warm-start"
            shift
            ;;
        --no-warm-start)
            WARM_START="--no-warm-start"
            shift
            ;;
        -h|--help)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Validate model choice
if [[ "$MODEL" != "anthropic" && "$MODEL" != "openai" ]]; then
    echo -e "${RED}Error: Model must be 'anthropic' or 'openai'${NC}"
    exit 1
fi

# Validate budget
if (( $(echo "$BUDGET < 0.001" | bc -l) )); then
    echo -e "${RED}Error: Budget must be at least \$0.001${NC}"
    exit 1
fi

# Print configuration
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  GOVERNANCE BAYESIAN OPTIMIZER        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo
echo -e "${GREEN}Configuration:${NC}"
echo "  Model:         ${YELLOW}$MODEL${NC}"
echo "  Budget:        ${YELLOW}\$${BUDGET}${NC}"
echo "  Initial samples: ${YELLOW}${N_INITIAL}${NC}"
echo "  Warm-start:    ${YELLOW}${WARM_START#--}${NC}"
echo

# Check if backend is running
echo -e "${YELLOW}Checking backend...${NC}"
if ! curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo -e "${YELLOW}Start it with: cd backend && npm start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend is running${NC}"
echo

# Check for required Python packages
echo -e "${YELLOW}Checking Python environment...${NC}"
if ! python3 -c "import numpy, sklearn, scipy" 2>/dev/null; then
    echo -e "${RED}❌ Required packages not installed!${NC}"
    echo -e "${YELLOW}Install with: pip install numpy scikit-learn scipy${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python dependencies available${NC}"
echo

# Run the appropriate optimizer
echo -e "${BLUE}Starting optimization...${NC}"
echo

if [[ "$MODEL" == "anthropic" ]]; then
    python3 governance-bayesian-optimizer.py \
        --budget "$BUDGET" \
        --n-initial "$N_INITIAL" \
        $WARM_START
else
    python3 governance-bayesian-optimizer-openai.py \
        --budget "$BUDGET" \
        --n-initial "$N_INITIAL" \
        $WARM_START
fi

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ Optimization completed successfully ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
else
    echo
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ Optimization failed                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
fi

exit $RESULT
