#!/bin/bash

# Corriger les apostrophes
sed -i "s/l'IA/l\&apos;IA/g" components/chat/Message.tsx
sed -i "s/qu'elle/qu\&apos;elle/g" components/chat/Message.tsx

# Corriger les guillemets dans Message.tsx
sed -i "s/showSources ? 'Masquer les sources' : 'Afficher les sources'/showSources ? \&quot;Masquer les sources\&quot; : \&quot;Afficher les sources\&quot;/g" components/chat/Message.tsx
sed -i 's/"\{suggestion.text\}"/\&quot;\{suggestion.text\}\&quot;/g' components/chat/Message.tsx

# Corriger les guillemets dans SmartRAGSuggestions.tsx
sed -i 's/"\{suggestion.text\}"/\&quot;\{suggestion.text\}\&quot;/g' components/ui/SmartRAGSuggestions.tsx

# Supprimer les imports non utilisés
sed -i '/import { SmartRAGSuggestions } from/d' components/chat/Message.tsx

# Supprimer les paramètres non utilisés
sed -i 's/lastStandardQuestion?: string;//g' components/ui/SmartRAGSuggestions.tsx
sed -i "s/lastStandardQuestion = '',//g" components/ui/SmartRAGSuggestions.tsx
