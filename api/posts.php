<?php
require_once __DIR__ . '/../php-lib/ParsedownExtra.php';

function parseFrontMatter($markdown) {
    if (preg_match('/^---\s*(.*?)\s*---\s*(.*)$/s', $markdown, $matches)) {
        $yaml = $matches[1];
        $content = $matches[2];

        $meta = [];
        foreach (explode("\n", $yaml) as $line) {
            if (preg_match('/^(\w+):\s*(.*)$/', $line, $m)) {
                $key = trim($m[1]);
                $value = trim($m[2]);
                if (str_starts_with($value, '[')) {
                    // tags: [a, b]
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

$posts = [];
$dir = __DIR__ . '/../posts';
foreach (scandir($dir) as $file) {
    if (str_ends_with($file, '.md')) {
        $markdown = file_get_contents("$dir/$file");
        $data = parseFrontMatter($markdown);
        $data['slug'] = pathinfo($file, PATHINFO_FILENAME);
        $posts[] = $data;
    }
}

if (isset($_GET['tags'])) {
  $posts = scanPosts();
  $tagCounts = [];

  foreach ($posts as $post) {
    foreach ($post['meta']['tags'] ?? [] as $tag) {
      $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
    }
  }

  ksort($tagCounts); // 按字母排序
  echo json_encode($tagCounts);
  exit;
}


header('Content-Type: application/json');
echo json_encode($posts);
