#!/bin/bash

# Monitor governance optimization tests and notify when complete

REPORT_FILE="/home/michaelgomes/AuditaAI/backend/governance-optimization-report.json"
CHECK_INTERVAL=30  # seconds
MAX_WAIT=3600      # 1 hour max

echo "🔍 Monitoring governance optimization tests..."
echo "Report will be saved to: $REPORT_FILE"
echo "Checking every ${CHECK_INTERVAL}s (max ${MAX_WAIT}s)"
echo ""

elapsed=0
last_size=0

while [ $elapsed -lt $MAX_WAIT ]; do
    # Check if playwright process is still running
    if pgrep -f "playwright.*governance-optimizer" > /dev/null; then
        # Get current file size if exists
        if [ -f "$REPORT_FILE" ]; then
            current_size=$(stat -c%s "$REPORT_FILE" 2>/dev/null || echo "0")
            if [ "$current_size" != "$last_size" ]; then
                echo "$(date +%H:%M:%S) - ⏳ Tests running... (report updating: ${current_size} bytes)"
                last_size=$current_size
            else
                echo "$(date +%H:%M:%S) - ⏳ Tests running..."
            fi
        else
            echo "$(date +%H:%M:%S) - ⏳ Tests running... (no report yet)"
        fi
    else
        # Process ended - check if report exists
        if [ -f "$REPORT_FILE" ]; then
            echo ""
            echo "✅ TESTS COMPLETE!"
            echo ""
            echo "═══════════════════════════════════════════════════════════════════"
            echo "GOVERNANCE OPTIMIZATION RESULTS"
            echo "═══════════════════════════════════════════════════════════════════"
            echo ""
            
            # Parse and display results
            if command -v jq &> /dev/null; then
                # Get number of variations tested
                num_variations=$(jq 'length' "$REPORT_FILE")
                echo "Tested $num_variations governance variations"
                echo ""
                
                # Rank by Omega improvement
                jq -r 'sort_by(-.avgOmegaImprovement) | .[] | 
                    "  " + (if .avgOmegaImprovement > 10 then "🥇" elif .avgOmegaImprovement > 7 then "🥈" elif .avgOmegaImprovement > 5 then "🥉" else "  " end) + 
                    " " + .description + 
                    " (" + (.avgOmegaImprovement | tostring) + "% Ω improvement)"' "$REPORT_FILE"
                
                echo ""
                echo "Best Variation Details:"
                echo "----------------------"
                
                best_variation=$(jq -r 'sort_by(-.avgOmegaImprovement) | .[0]' "$REPORT_FILE")
                
                echo "$best_variation" | jq -r '"
File: " + .file + "
Average Omega Improvement: " + (.avgOmegaImprovement | tostring) + "%
Success Rate: " + .successRate + "

Pillar Breakdown:"'
                
                # Get pillar improvements for best variation
                echo "$best_variation" | jq -r '.prompts[] | select(.error == null) | .improvements | 
                    "  C: " + ((.C.percentage * 10 | round / 10) | tostring) + "%" +
                    "  R: " + ((.R.percentage * 10 | round / 10) | tostring) + "%" +
                    "  I: " + ((.I.percentage * 10 | round / 10) | tostring) + "%" +
                    "  E: " + ((.E.percentage * 10 | round / 10) | tostring) + "%" +
                    "  S: " + ((.S.percentage * 10 | round / 10) | tostring) + "%"' | head -1
                
                echo ""
                echo "Recommendation:"
                
                best_omega=$(echo "$best_variation" | jq -r '.avgOmegaImprovement')
                best_file=$(echo "$best_variation" | jq -r '.file')
                
                if (( $(echo "$best_omega > 8" | bc -l) )); then
                    echo "  ✅ DEPLOY: $best_file"
                    echo "  Expected improvement: +${best_omega}%"
                    echo ""
                    echo "  To apply:"
                    echo "    cp governance/$best_file governance/rosetta-frontier.txt"
                elif (( $(echo "$best_omega > 5" | bc -l) )); then
                    echo "  ⚠️  MARGINAL: $best_file"
                    echo "  Improvement: +${best_omega}% (target: >8%)"
                    echo "  Consider further optimization"
                else
                    echo "  ❌ NO CLEAR WINNER"
                    echo "  Best: +${best_omega}% (target: >8%)"
                    echo "  Consider new governance approaches"
                fi
                
            else
                echo "Install 'jq' for formatted results, or view raw JSON:"
                echo "  cat $REPORT_FILE | python3 -m json.tool"
            fi
            
            echo ""
            echo "═══════════════════════════════════════════════════════════════════"
            echo "Full report: $REPORT_FILE"
            echo "═══════════════════════════════════════════════════════════════════"
            
            # Send desktop notification if available
            if command -v notify-send &> /dev/null; then
                best_omega_rounded=$(jq -r 'sort_by(-.avgOmegaImprovement) | .[0].avgOmegaImprovement | tostring' "$REPORT_FILE" 2>/dev/null || echo "N/A")
                notify-send "Governance Tests Complete" "Best result: +${best_omega_rounded}% Omega improvement" -u normal
            fi
            
            # Beep if available
            if command -v paplay &> /dev/null && [ -f /usr/share/sounds/freedesktop/stereo/complete.oga ]; then
                paplay /usr/share/sounds/freedesktop/stereo/complete.oga 2>/dev/null
            else
                echo -e '\a' # Terminal bell
            fi
            
            exit 0
        else
            echo ""
            echo "⚠️  Tests ended but no report found"
            echo "Check for errors in test output"
            exit 1
        fi
    fi
    
    sleep $CHECK_INTERVAL
    elapsed=$((elapsed + CHECK_INTERVAL))
done

echo ""
echo "⏱️  Timeout reached (${MAX_WAIT}s)"
echo "Tests may still be running. Check manually:"
echo "  ps aux | grep playwright"
exit 2
