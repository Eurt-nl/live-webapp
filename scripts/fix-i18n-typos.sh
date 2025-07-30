#!/bin/zsh

LOG_FILE="fix-i18n-typos.log"
echo "📝 Logging to $LOG_FILE"
echo "=== Fix i18n Typos Log ===" > $LOG_FILE
date >> $LOG_FILE
echo "" >> $LOG_FILE

echo "🔍 Previewing all suspicious \$customT issues..." | tee -a $LOG_FILE
grep -R "[A-Za-z]\$customT" src | tee -a $LOG_FILE

echo "\n🚦 Starting automated fixes with backups (.bak will be created for each file)..." | tee -a $LOG_FILE

# Twee parallelle arrays voor automatische fixes
keys=(
  "clearTimeou\$customT"
  "setTimeou\$customT"
  "setSor\$customT"
  "charA\$customT"
  "sqr\$customT"
  "spli\$customT"
  "parseIn\$customT"
  "getContex\$customT"
  "clearRec\$customT"
  "fillRec\$customT"
  "fillTex\$customT"
  "getFullLis\$customT"
  "rese\$customT"
  "Selec\$customT"
  "Participan\$customT"
  "Even\$customT"
  "Rese\$customT"
)
values=(
  "clearTimeout"
  "setTimeout"
  "setSort"
  "charAt"
  "sqrt"
  "split"
  "parseInt"
  "getContext"
  "clearRect"
  "fillRect"
  "fillText"
  "getFullList"
  "reset"
  "Select"
  "Participant"
  "Event"
  "Reset"
)

# Itereer over de keys en voer fixes uit
for i in {1..${#keys[@]}}; do
  key="${keys[$i]}"
  value="${values[$i]}"
  echo "🔧 Fixing $key → $value" | tee -a $LOG_FILE
  grep -Rl "$key" src | while read file; do
    echo "   -> Patching $file" | tee -a $LOG_FILE
    cp "$file" "$file.bak"
    sed -i '' "s/$key/$value/g" "$file"
    echo "--- Diff for $file ---" >> $LOG_FILE
    diff -u "$file.bak" "$file" >> $LOG_FILE || echo "   (No changes detected)" >> $LOG_FILE
    echo "" >> $LOG_FILE
  done
done

# EXTRA FIX: dubbele $$customT corrigeren
echo "\n🔧 Fixing $$customT → $customT" | tee -a $LOG_FILE
grep -Rl "\$\$customT" src | while read file; do
  echo "   -> Patching $file" | tee -a $LOG_FILE
  cp "$file" "$file.bak"
  sed -i '' 's/\$\$customT/\$customT/g' "$file"
  echo "--- Diff for $file ---" >> $LOG_FILE
  diff -u "$file.bak" "$file" >> $LOG_FILE || echo "   (No changes detected)" >> $LOG_FILE
  echo "" >> $LOG_FILE
done

# Eindscan
echo "\n✅ Automated fixes applied!" | tee -a $LOG_FILE
echo "\n🔍 Final scan for suspicious \$customT usage (should be empty if clean):" | tee -a $LOG_FILE
grep -R "[A-Za-z]\$customT" src | tee -a $LOG_FILE || echo "🎉 No remaining suspicious \$customT found!" | tee -a $LOG_FILE

echo "\n🔍 Final scan for $$customT usage (should be empty if clean):" | tee -a $LOG_FILE
grep -R "\$\$customT" src | tee -a $LOG_FILE || echo "🎉 No $$customT found!" | tee -a $LOG_FILE

echo "\n🗂 Backups created as *.bak" | tee -a $LOG_FILE
echo "🔄 To restore backups: find src -name \"*.bak\" -exec sh -c 'cp \"{}\" \"\${0%.bak}\"' {} \;" | tee -a $LOG_FILE
echo "🧹 To delete backups: find src -name \"*.bak\" -delete" | tee -a $LOG_FILE