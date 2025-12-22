#!/bin/bash

echo "=== ANALYZING SOFA FACTORY MANAGER PROJECT ==="
echo ""

echo "1. MAIN BUSINESS COMPONENTS:"
echo "----------------------------"
ls -1 src/components/ | grep -v "^ui$" | grep -v "^Auth$" | grep -v "^Layout$" | grep -v "\.jsx$"

echo ""
echo "2. DATABASE TABLES:"
echo "-------------------"
grep "createObjectStore" src/lib/database.js | sed "s/.*createObjectStore('\([^']*\)'.*/\1/"

echo ""
echo "3. STATE MANAGEMENT (AppContext):"
echo "----------------------------------"
grep "^  [a-z].*: \[\]," src/contexts/AppContext.jsx | sed 's/://g'

echo ""
echo "4. ROUTES/VIEWS:"
echo "----------------"
grep "case '" src/components/ViewRenderer.jsx | sed "s/.*case '\([^']*\)'.*/\1/" | head -20

