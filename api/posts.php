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

$dir = __DIR__ . '/../posts';
$posts = [];

// 產生文章列表 JSON
foreach (glob("$dir/*.md") as $filepath) {
    try {
        $slug = basename($filepath, '.md');
        $content = file_get_contents($filepath);
        [$meta, ] = parse_front_matter($content);

        $posts[] = [
            'slug' => $slug,
            'title' => $meta['title'] ?? $slug,
            'date' => $meta['date'] ?? '',
            'category' => $meta['category'] ?? null,
            'summary' => $meta['summary'] ?? '',
            'tags' => $meta['tags'] ?? [],
            'updated' => filemtime($filepath),
        ];
    } catch (Throwable $e) {
        error_log("⚠️ 解析失敗：$filepath - " . $e->getMessage());
        // 忽略壞掉的檔案
    }
}

// 依照日期新到舊排序
usort($posts, fn($a, $b) => strtotime($b['date']) <=> strtotime($a['date']));

header('Content-Type: application/json; charset=utf-8');

// 防止 JSON 編碼錯誤
$json = json_encode($posts, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($json === false) {
    http_response_code(500);
    echo json_encode(["error" => "JSON encode failed: " . json_last_error_msg()]);
    exit;
}

echo $json;
?>