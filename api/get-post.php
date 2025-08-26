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
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => "Invalid post identifier"]);
    exit;
}

$filepath = __DIR__ . "/../posts/$slug.md";

if (!file_exists($filepath)) {
    http_response_code(404);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => "Post not found"]);
    exit;
}

try {
    $markdown = file_get_contents($filepath);
    [$meta, $content] = parse_front_matter($markdown);

    // Load Parsedown for markdown conversion
    require_once __DIR__ . '/../php-lib/Parsedown.php';
    require_once __DIR__ . '/../php-lib/ParsedownExtra.php';
    
    if (!class_exists('ParsedownExtra')) {
        throw new Exception("ParsedownExtra not available");
    }

    $Parsedown = new ParsedownExtra();
    $Parsedown->setMarkupEscaped(true);
    $html = $Parsedown->text($content);

    // Prepare response
    $response = [
        'slug' => $slug,
        'meta' => [
            'title' => $meta['title'] ?? ucfirst(str_replace('-', ' ', $slug)),
            'date' => $meta['date'] ?? '',
            'category' => $meta['category'] ?? null,
            'summary' => $meta['summary'] ?? '',
            'tags' => $meta['tags'] ?? []
        ],
        'content' => $html
    ];

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Throwable $e) {
    error_log("Error processing post $slug: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => "Failed to process post"]);
}
?>