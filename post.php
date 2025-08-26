<?php
require_once('./php-lib/ParsedownExtra.php');

function extractMarkdownContent($markdown) {
    return preg_replace('/^---\s*.*?---\s*/s', '', $markdown);
}

$slug = $_GET['slug'] ?? '';
$filepath = "./posts/$slug.md";

if (!file_exists($filepath)) {
    http_response_code(404);
    echo "Post not found.";
    exit;
}

$md = file_get_contents($filepath);
$Parsedown = new ParsedownExtra();
$html = $Parsedown->text(extractMarkdownContent($md));
?>

<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <title><?= htmlspecialchars($slug) ?></title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="p-10 bg-gray-100 text-gray-800">
  <article class="prose max-w-screen-md mx-auto bg-white p-8 rounded-xl shadow">
    <?= $html ?>
  </article>
</body>
</html>