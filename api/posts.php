<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

try {
    require_once __DIR__ . '/../php-lib/ParsedownExtra.php';
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to load Parsedown: ' . $e->getMessage()]);
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
    $posts = scanPosts();
    $tagCounts = [];

    foreach ($posts as $post) {
        foreach ($post['tags'] as $tag) {
            $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
        }
    }

    ksort($tagCounts);
    header('Content-Type: application/json');
    echo json_encode($tagCounts);
    exit;
}

// Return all posts
header('Content-Type: application/json');
try {
    $posts = scanPosts();
    echo json_encode($posts);
} catch (Exception $e) {
    echo json_encode(['error' => 'Failed to scan posts: ' . $e->getMessage()]);
}
?>