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

require_once __DIR__ . '/php-lib/Parsedown.php';
require_once __DIR__ . '/php-lib/ParsedownExtra.php';
if (!class_exists('ParsedownExtra')) {
    http_response_code(500);
    exit("❌ ParsedownExtra 載入失敗！");
}

$dir = __DIR__ . '/posts';
$posts = [];

if (isset($_GET['name'])) {
    $slug = basename($_GET['name']);
    $file = "$dir/$slug.md";

    if (!file_exists($file)) {
        http_response_code(404);
        echo "<h1>404 Not Found</h1>";
        exit;
    }

    $markdown = file_get_contents($file);
    [$meta, $content] = parse_front_matter($markdown);

    $Parsedown = new ParsedownExtra();
    $Parsedown->setMarkupEscaped(true);
    $html = $Parsedown->text($content);

    $title = $meta['title'] ?? $slug;
    $date = $meta['date'] ?? '';
    $tags = $meta['tags'] ?? [];

    echo "<!DOCTYPE html><html><head><meta charset='utf-8'>";
    echo "<title>" . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . "</title>";
    echo "<script src='https://cdn.tailwindcss.com'></script>";
    echo "<link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css'>";
    echo "<script src='https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js'></script>";
    echo "<script>
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelectorAll('pre code').forEach(block => {
            hljs.highlightElement(block);
        });
    });
    </script>";
    echo "<script>
    document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('pre').forEach(pre => {
        const wrapper = document.createElement('div');
        wrapper.className = 'relative';
        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(pre);

        const button = document.createElement('button');
        button.textContent = '📋 複製';
        button.className = 'absolute top-2 right-2 bg-gray-200 text-sm px-2 py-1 rounded hover:bg-gray-300';
        button.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (code) {
            navigator.clipboard.writeText(code.innerText).then(() => {
            button.textContent = '✅ 已複製';
            setTimeout(() => button.textContent = '📋 複製', 2000);
            });
        }
        });

        wrapper.appendChild(button);
    });
    });
    </script>";
    echo "</head><body class='p-6 max-w-3xl mx-auto prose'>";
    echo "<a href='/index.html' class='text-sm text-blue-600'>← 返回</a>";
    echo "<h1>" . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . "</h1>";
    if ($date) echo "<p class='text-sm text-gray-500'>🗓 " . htmlspecialchars($date) . "</p>";
    if (!empty($tags)) {
        echo "<p class='text-sm'>";
        foreach ($tags as $tag) {
            echo "<span class='inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded mr-1 text-xs'>#" . htmlspecialchars($tag) . "</span>";
        }
        echo "</p>";
    }
    echo $html;
    echo "</body></html>";
    exit;
}

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
