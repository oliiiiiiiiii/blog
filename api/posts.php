<?php
// Force JSON output with no stray HTML
ob_start();
header('Content-Type: application/json; charset=utf-8');

// Robust error handling: convert warnings/notices to exceptions and avoid HTML error output
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('html_errors', '0');
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false; // respect @ operator
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
});

try {
    require_once __DIR__ . '/../php-lib/ParsedownExtra.php';
} catch (Throwable $e) {
    http_response_code(500);
    ob_clean();
    echo json_encode(['error' => 'Failed to load Parsedown', 'detail' => $e->getMessage()]);
    exit;
}

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
                if (substr($value, 0, 1) === '[' && substr($value, -1) === ']') {
                    $value = array_map('trim', explode(',', trim($value, '[]')));
                }
                
                $meta[$key] = $value;
            }
        }
        $meta['content'] = $content;
        return $meta;
    }
    return ['content' => $markdown];
}

function scanPosts() {
    $posts = [];
    $dir = __DIR__ . '/../posts';
    
    if (!is_dir($dir)) {
        return $posts;
    }
    
    foreach (scandir($dir) as $file) {
        if (substr($file, -3) === '.md') {
            $markdown = file_get_contents("$dir/$file");
            $data = parseFrontMatter($markdown);
            $slug = pathinfo($file, PATHINFO_FILENAME);
            
            // Structure the data properly
            $post = [
                'slug' => $slug,
                'title' => $data['title'] ?? 'Untitled',
                'date' => $data['date'] ?? '',
                // Do not force a default category; absence means it only appears in "All"
                'category' => $data['category'] ?? null,
                'tags' => $data['tags'] ?? [],
                'summary' => $data['summary'] ?? '',
                'content' => $data['content']
            ];
            
            $posts[] = $post;
        }
    }
    
    // Sort by date (newest first)
    usort($posts, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    return $posts;
}

// Handle tags request
if (isset($_GET['tags'])) {
    try {
        $posts = scanPosts();
        $tagCounts = [];
        foreach ($posts as $post) {
            foreach ($post['tags'] as $tag) {
                if ($tag === '' || $tag === null) continue;
                $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
            }
        }
        ksort($tagCounts);
        ob_clean();
        echo json_encode($tagCounts);
        exit;
    } catch (Throwable $e) {
        http_response_code(500);
        ob_clean();
        echo json_encode(['error' => 'Failed to compute tags', 'detail' => $e->getMessage()]);
        exit;
    }
}

// Return all posts
try {
    $posts = scanPosts();
    ob_clean();
    echo json_encode($posts);
} catch (Throwable $e) {
    http_response_code(500);
    ob_clean();
    echo json_encode(['error' => 'Failed to scan posts', 'detail' => $e->getMessage()]);
}
?>