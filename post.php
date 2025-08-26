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
  
  <style>
    /* Enhanced markdown styling */
    .prose {
      color: #374151;
      line-height: 1.75;
    }
    
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      color: #111827;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .prose h1 { font-size: 2.25rem; }
    .prose h2 { font-size: 1.875rem; }
    .prose h3 { font-size: 1.5rem; }
    .prose h4 { font-size: 1.25rem; }
    
    .prose p {
      margin-bottom: 1.5rem;
    }
    
    .prose ul, .prose ol {
      margin-bottom: 1.5rem;
      padding-left: 1.5rem;
    }
    
    .prose li {
      margin-bottom: 0.5rem;
    }
    
    .prose blockquote {
      border-left: 4px solid #3b82f6;
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      color: #6b7280;
      background-color: #f8fafc;
      padding: 1rem;
      border-radius: 0.375rem;
    }
    
    .prose a {
      color: #3b82f6;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 2px;
    }
    
    .prose a:hover {
      color: #1d4ed8;
    }
    
    .prose strong {
      font-weight: 700;
      color: #111827;
    }
    
    .prose em {
      font-style: italic;
    }
    
    .prose hr {
      border: none;
      border-top: 2px solid #e5e7eb;
      margin: 2rem 0;
    }
    
    .prose table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 0.875rem;
    }
    
    .prose th, .prose td {
      border: 1px solid #d1d5db;
      padding: 0.75rem;
      text-align: left;
    }
    
    .prose th {
      background-color: #f9fafb;
      font-weight: 600;
    }
    
    .prose img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }
    
    /* Code block styling */
    .prose pre {
      background-color: #1f2937;
      border-radius: 0.5rem;
      padding: 1rem;
      margin: 1.5rem 0;
      overflow-x: auto;
      position: relative;
    }
    
    .prose pre code {
      color: #f3f4f6;
      font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
      line-height: 1.5;
    }
    
    /* Inline code styling */
    .prose code:not(pre code) {
      background-color: #f3f4f6;
      color: #dc2626;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
    }
    
    /* Copy button */
    .copy-button {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background-color: #374151;
      color: #f9fafb;
      border: none;
      border-radius: 0.25rem;
      padding: 0.25rem 0.5rem;
      font-size: 0.75rem;
      cursor: pointer;
      opacity: 0.7;
      transition: opacity 0.2s;
    }
    
    .copy-button:hover {
      opacity: 1;
      background-color: #4b5563;
    }
    
    .copy-button.copied {
      background-color: #059669;
    }
  </style>
  
  <?php if (isset($frontMatter['summary'])): ?>
  <meta name="description" content="<?= htmlspecialchars($frontMatter['summary']) ?>">
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