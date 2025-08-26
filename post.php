<?php
require_once('./php-lib/ParsedownExtra.php');

function parseFrontMatter($markdown) {
    if (preg_match('/^---\s*(.*?)\s*---\s*(.*)$/s', $markdown, $matches)) {
        $yaml = $matches[1];
        $content = $matches[2];

        $meta = [];
        foreach (explode("\n", $yaml) as $line) {
            if (preg_match('/^(\w+):\s*(.*)$/', $line, $m)) {
                $key = trim($m[1]);
                $value = trim($m[2]);
                
                // Handle arrays like tags: [a, b, c]
                if (str_starts_with($value, '[') && str_ends_with($value, ']')) {
                    $value = array_map('trim', explode(',', trim($value, '[]')));
                }
                
                $meta[$key] = $value;
            }
        }
        return $meta;
    }
    return [];
}

function extractMarkdownContent($markdown) {
    return preg_replace('/^---\s*.*?---\s*/s', '', $markdown);
}

// Get slug from URL parameter
$slug = $_GET['slug'] ?? '';

// Validate slug (security measure)
if (empty($slug) || !preg_match('/^[a-zA-Z0-9\-_]+$/', $slug)) {
    http_response_code(400);
    echo "Invalid post identifier.";
    exit;
}

$filepath = "./posts/$slug.md";

if (!file_exists($filepath)) {
    http_response_code(404);
    echo "Post not found.";
    exit;
}

$markdown = file_get_contents($filepath);
$frontMatter = parseFrontMatter($markdown);
$content = extractMarkdownContent($markdown);

$Parsedown = new ParsedownExtra();
$html = $Parsedown->text($content);

// Get title from front matter or use slug as fallback
$title = $frontMatter['title'] ?? ucfirst(str_replace('-', ' ', $slug));
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title><?= htmlspecialchars($title) ?> - Oli's Blog</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="./assets/css/style.css"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
  
  <?php if (isset($frontMatter['summary'])): ?>
  <meta name="description" content="<?= htmlspecialchars($frontMatter['summary']) ?>">
  <?php endif; ?>
</head>
<body class="bg-gray-50 text-gray-800" style="font-family: 'Playfair Display', serif;">
  
  <!-- Navigation bar -->
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-4xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <a href="/" class="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors">
          ← Back to Blog
        </a>
        <div class="text-sm text-gray-500">
          <?= htmlspecialchars($frontMatter['date'] ?? '') ?>
        </div>
      </div>
    </div>
  </nav>

  <!-- Article content -->
  <main class="max-w-4xl mx-auto px-4 py-8">
    <article class="bg-white rounded-lg shadow-sm p-8">
      
      <!-- Article header -->
      <header class="mb-8 border-b pb-6">
        <h1 class="text-4xl font-bold mb-4 text-gray-900"><?= htmlspecialchars($title) ?></h1>
        
        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <?php if (isset($frontMatter['date'])): ?>
          <div class="flex items-center">
            <span class="font-medium">Published:</span>
            <span class="ml-1"><?= htmlspecialchars($frontMatter['date']) ?></span>
          </div>
          <?php endif; ?>
          
          <?php if (isset($frontMatter['category'])): ?>
          <div class="flex items-center">
            <span class="font-medium">Category:</span>
            <span class="ml-1 bg-gray-100 px-2 py-1 rounded"><?= htmlspecialchars($frontMatter['category']) ?></span>
          </div>
          <?php endif; ?>
        </div>
        
        <?php if (isset($frontMatter['tags']) && is_array($frontMatter['tags'])): ?>
        <div class="flex flex-wrap gap-2 mt-4">
          <?php foreach ($frontMatter['tags'] as $tag): ?>
          <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            <?= htmlspecialchars(trim($tag)) ?>
          </span>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
        
        <?php if (isset($frontMatter['summary'])): ?>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <p class="text-gray-700 italic"><?= htmlspecialchars($frontMatter['summary']) ?></p>
        </div>
        <?php endif; ?>
      </header>
      
      <!-- Article body -->
      <div class="prose prose-lg max-w-none">
        <?= $html ?>
      </div>
      
    </article>
  </main>

  <!-- Footer with navigation -->
  <footer class="max-w-4xl mx-auto px-4 py-8">
    <div class="text-center">
      <a href="/" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Return to Blog Home
      </a>
    </div>
  </footer>

</body>
</html>