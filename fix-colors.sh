#!/bin/bash

# Fix Authors page - remove purple/blue gradients
sed -i '' 's/bg-gradient-to-br from-purple-50 via-background to-blue-50 dark:from-gray-900 dark:via-background dark:to-gray-900/bg-background/g' app/authors/page.tsx
sed -i '' 's/bg-gradient-to-r from-purple-500 to-blue-600 rounded-full mb-4/border-2 border-border rounded-full mb-4 bg-card/g' app/authors/page.tsx
sed -i '' 's/text-white">Discover Writers/">Discover Writers/g' app/authors/page.tsx
sed -i '' 's/border-purple-200 dark:border-purple-900/border-border/g' app/authors/page.tsx
sed -i '' 's/border-blue-200 dark:border-blue-900/border-border/g' app/authors/page.tsx
sed -i '' 's/border-green-200 dark:border-green-900/border-border/g' app/authors/page.tsx
sed -i '' 's/border-yellow-200 dark:border-yellow-900/border-border/g' app/authors/page.tsx
sed -i '' 's/bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-900/bg-card/g' app/authors/page.tsx
sed -i '' 's/bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-gray-900/bg-card/g' app/authors/page.tsx
sed -i '' 's/bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-gray-900/bg-card/g' app/authors/page.tsx
sed -i '' 's/bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950 dark:to-gray-900/bg-card/g' app/authors/page.tsx
sed -i '' 's/text-purple-600/text-foreground/g' app/authors/page.tsx
sed -i '' 's/text-blue-600/text-foreground/g' app/authors/page.tsx
sed -i '' 's/text-green-600/text-foreground/g' app/authors/page.tsx
sed -i '' 's/text-yellow-600/text-foreground/g' app/authors/page.tsx
sed -i '' 's/text-orange-600/text-foreground/g' app/authors/page.tsx
sed -i '' 's/bg-purple-100 dark:bg-purple-950/bg-muted/g' app/authors/page.tsx
sed -i '' 's/bg-purple-600 hover:bg-purple-700/bg-primary hover:bg-primary\/90/g' app/authors/page.tsx
sed -i '' 's/data-\[state=active\]:bg-purple-600 data-\[state=active\]:text-white/data-[state=active]:bg-primary data-[state=active]:text-primary-foreground/g' app/authors/page.tsx
sed -i '' 's/hover:bg-purple-600 hover:text-white/hover:bg-primary hover:text-primary-foreground/g' app/authors/page.tsx

# Fix Works page - remove amber/orange gradients
sed -i '' 's/bg-gradient-to-br from-amber-50 via-background to-orange-50 dark:from-gray-900 dark:via-background dark:to-gray-900/bg-background/g' app/works/page.tsx
sed -i '' 's/bg-gradient-to-r from-amber-500 to-orange-600 rounded-full mb-4/border-2 border-border rounded-full mb-4 bg-card/g' app/works/page.tsx
sed -i '' 's/text-white">Discover Works/">Discover Works/g' app/works/page.tsx
sed -i '' 's/border-amber-200 dark:border-amber-900/border-border/g' app/works/page.tsx
sed -i '' 's/border-orange-200 dark:border-orange-900/border-border/g' app/works/page.tsx
sed -i '' 's/bg-gradient-to-br from-amber-50 to-white dark:from-amber-950 dark:to-gray-900/bg-card/g' app/works/page.tsx
sed -i '' 's/bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-gray-900/bg-card/g' app/works/page.tsx
sed -i '' 's/bg-gradient-to-br from-amber-600 to-orange-700/bg-muted/g' app/works/page.tsx
sed -i '' 's/text-amber-600/text-foreground/g' app/works/page.tsx
sed -i '' 's/text-orange-600/text-foreground/g' app/works/page.tsx
sed -i '' 's/border-amber-300 focus:border-amber-500/border-border/g' app/works/page.tsx
sed -i '' 's/border-amber-600 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/border-border hover:bg-muted/g' app/works/page.tsx
sed -i '' 's/bg-amber-600 text-white/bg-primary text-primary-foreground/g' app/works/page.tsx
sed -i '' 's/bg-amber-600 hover:bg-amber-700/bg-primary hover:bg-primary\/90/g' app/works/page.tsx
sed -i '' 's/hover:bg-amber-50 dark:hover:bg-amber-950/hover:bg-muted/g' app/works/page.tsx
sed -i '' 's/bg-amber-100 dark:bg-amber-950/bg-muted/g' app/works/page.tsx
sed -i '' 's/data-\[state=active\]:bg-amber-600 data-\[state=active\]:text-white/data-[state=active]:bg-primary data-[state=active]:text-primary-foreground/g' app/works/page.tsx
sed -i '' 's/border-amber-300 text-amber-700 dark:text-amber-400/border-border/g' app/works/page.tsx
sed -i '' 's/bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200/bg-muted/g' app/works/page.tsx
sed -i '' 's/hover:text-amber-600/hover:text-foreground/g' app/works/page.tsx
sed -i '' 's/border-amber-600 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/border-border hover:bg-muted/g' app/works/page.tsx
sed -i '' 's/hover:bg-amber-200 dark:hover:bg-amber-900/hover:bg-muted/g' app/works/page.tsx
sed -i '' 's/bg-green-600/bg-primary/g' app/works/page.tsx

echo "✅ Color scheme fixes applied to Authors and Works pages"
