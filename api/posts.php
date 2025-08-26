<?php
require_once('../php-lib/ParsedownExtra.php');
require_once('../php-lib/Parsedown.php');

function parseFrontMatter(string $markdown): array {
    if (preg_match('/^---\s*(.*?)\s*---\s*/s', $markdown, $matches)) {
        $yaml = $matches[1];
        $lines = explode("\n", $yaml);
        $meta = [];

        foreach ($lines as $line) {
            if (preg_match('/^(\w+):\s*(.*)$/', trim($line), $m)) {
                $key = strtolower($m[1]);
                $value = trim($m[2]);
                if ($key === 'tags') {
                    $value = trim($value, '[]');
                    $tags = array_filter(array_map('trim', explode(',', $value)));
                    $meta['tags'] = $tags;
                } else {
                    $meta[$key] = $value;
                }
            }
        }

        return $meta;
    }
    return [];
}

function loadAllPosts($dir = '../posts') {
    $posts = [];

    foreach (glob("$dir/*.md") as $file) {
        $content = file_get_contents($file);
        $meta = parseFrontMatter($content);

        if (!empty($meta)) {
            $meta['slug'] = basename($file, '.md');
            $posts[] = $meta;
        }
    }

    return $posts;
}

header('Content-Type: application/json');
echo json_encode(loadAllPosts());
