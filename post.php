<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

function parse_front_matter(string $content): array {
    if (preg_match('/^---\s*(.*?)\s*---\s*(.*)$/s', $content, $matches)) {
        $raw_yaml = $matches[1];
        $body = $matches[2];
        $meta = [];

        foreach (explode("\n", $raw_yaml) as $line) {
            if (preg_match('/^([a-zA-Z0-9_]+):\s*(.*)$/', trim($line), $m)) {
                $key = strtolower($m[1]);
                $value = trim($m[2]);
                if ($key === 'tags') {
                    $value = trim($value, '[]');
                    $value = array_filter(array_map('trim', explode(',', $value)));
                }
                $meta[$key] = $value;
            }
        }

        return [$meta, $body];
    }

    return [[], $content];
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
[$meta, $content] = parse_front_matter($markdown);

require_once __DIR__ . '/php-lib/Parsedown.php';
require_once __DIR__ . '/php-lib/ParsedownExtra.php';
if (!class_exists('ParsedownExtra')) {
    http_response_code(500);
    exit("❌ ParsedownExtra 載入失敗！");
}

$Parsedown = new ParsedownExtra();
$Parsedown->setMarkupEscaped(true);
$html = $Parsedown->text($content);

// Get title from front matter or use slug as fallback
$title = $meta['title'] ?? ucfirst(str_replace('-', ' ', $slug));
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title><?= htmlspecialchars($title) ?> - Oli's Blog</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="./assets/css/style.css"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-lua.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500&display=swap" rel="stylesheet">
  
  <?php if (isset($meta['summary'])): ?>
  <meta name="description" content="<?= htmlspecialchars($meta['summary']) ?>">
  <?php endif; ?>
</head>
<body class="bg-gray-50 text-gray-800" style="font-family: 'Playfair Display', serif;">
  
  <!-- Navigation bar -->
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-4xl mx-auto px-4 py-3">
      <div class="flex items-center justify-between">
        <a href="#" onclick="goBack()" class="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors">
          ← Back to Blog
        </a>
        <div class="text-sm text-gray-500">
          <?= htmlspecialchars($meta['date'] ?? '') ?>
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
          <?php if (isset($meta['date'])): ?>
          <div class="flex items-center">
            <span class="font-medium">Published:</span>
            <span class="ml-1"><?= htmlspecialchars($meta['date']) ?></span>
          </div>
          <?php endif; ?>
          
          <?php if (isset($meta['category'])): ?>
          <div class="flex items-center">
            <span class="font-medium">Category:</span>
            <span class="ml-1 bg-gray-100 px-2 py-1 rounded"><?= htmlspecialchars($meta['category']) ?></span>
          </div>
          <?php endif; ?>
        </div>
        
        <?php if (isset($meta['tags']) && is_array($meta['tags']) && !empty($meta['tags'])): ?>
        <div class="flex flex-wrap gap-2 mt-4">
          <?php foreach ($meta['tags'] as $tag): ?>
          <span class="article-tag px-3 py-1 rounded-full text-sm font-medium">
            <?= htmlspecialchars($tag) ?>
          </span>
          <?php endforeach; ?>
        </div>
        <?php endif; ?>
        
        <?php if (isset($meta['summary'])): ?>
        <div class="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
          <p class="text-gray-700"><?= htmlspecialchars($meta['summary']) ?></p>
        </div>
        <?php endif; ?>
      </header>
      
      <!-- Article body -->
      <div class="prose prose-lg max-w-none" id="post-content">
        <?= $html ?>
      </div>
      
    </article>
  </main>

  <!-- Footer with navigation -->
  <footer class="max-w-4xl mx-auto px-4 py-8">
    <div class="text-center">
      <a href="#" onclick="goBack()" class="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        Return to Blog Home
      </a>
    </div>
  </footer>

  <script>
    // Add copy buttons to code blocks
    function addCopyButtons() {
      const codeBlocks = document.querySelectorAll('pre');
      codeBlocks.forEach((block, index) => {
        const button = document.createElement('button');
        button.className = 'copy-button';
        button.textContent = 'Copy';
        button.onclick = () => copyCode(block, button);
        block.appendChild(button);
      });
    }

    // Copy code to clipboard
    async function copyCode(block, button) {
      const code = block.querySelector('code');
      const text = code ? code.textContent : block.textContent;
      
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      } catch (err) {
        console.error('Failed to copy code:', err);
        button.textContent = 'Failed';
        setTimeout(() => {
          button.textContent = 'Copy';
        }, 2000);
      }
    }

    // Go back to previous page or home if no history
    function goBack() {
      if (document.referrer && document.referrer.includes(window.location.origin)) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }

    // Initialize when page loads
    document.addEventListener('DOMContentLoaded', function() {
      // Add copy buttons to code blocks
      addCopyButtons();
      
      // Highlight syntax with Prism
      if (window.Prism) {
        Prism.highlightAll();
      }
    });
  </script>

</body>
</html>