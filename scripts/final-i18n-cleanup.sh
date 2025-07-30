#!/bin/zsh

LOG_FILE="final-i18n-cleanup.log"
echo "📝 Logging naar $LOG_FILE"
echo "=== Final i18n Cleanup Log ===" > $LOG_FILE
date >> $LOG_FILE
echo "" >> $LOG_FILE

# 1️⃣ Scan actieve code op resterende issues
echo "🔍 Scannen op verdachte \$customT regels (exclusief backups)..." | tee -a $LOG_FILE
grep -R "[A-Za-z]\$customT" src --exclude='*.bak*' | tee -a $LOG_FILE || echo "🎉 Geen verdachte \$customT gevonden!" | tee -a $LOG_FILE

echo "\n🔍 Scannen op dubbele \$\$customT regels (exclusief backups)..." | tee -a $LOG_FILE
grep -R "\$\$customT" src --exclude='*.bak*' | tee -a $LOG_FILE || echo "🎉 Geen dubbele \$customT gevonden!" | tee -a $LOG_FILE

# 2️⃣ ESLint check
echo "\n🧹 ESLint uitvoeren..." | tee -a $LOG_FILE
npm run lint | tee -a $LOG_FILE

# 3️⃣ Backups verwijderen (optioneel)
echo "\n🗑 Wil je alle backupbestanden (*.bak) verwijderen? [y/N]"
read confirm
if [[ "$confirm" == "y" || "$confirm" == "Y" ]]; then
  find src -name "*.bak*" -delete
  echo "✅ Alle backups verwijderd!" | tee -a $LOG_FILE
else
  echo "ℹ️ Backups behouden. Je kunt ze later verwijderen met:" | tee -a $LOG_FILE
  echo "    find src -name \"*.bak*\" -delete" | tee -a $LOG_FILE
fi

# 4️⃣ Start app automatisch
echo "\n🚀 App starten in development mode..." | tee -a $LOG_FILE
quasar dev | tee -a $LOG_FILE

echo "\n=== Cleanup en check voltooid! ===" | tee -a $LOG_FILE