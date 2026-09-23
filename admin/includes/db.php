<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

function getDb() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dataDir = dirname(DB_FILE);
    if (!is_dir($dataDir)) {
        mkdir($dataDir, 0755, true);
    }

    $isNew = !file_exists(DB_FILE);

    $pdo = new PDO('sqlite:' . DB_FILE);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON');

    $pdo->exec('CREATE TABLE IF NOT EXISTS admin_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
    )');

    $pdo->exec('CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip TEXT NOT NULL,
        attempted_at INTEGER NOT NULL
    )');
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts (ip, attempted_at)');

    $pdo->exec('CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        description TEXT NOT NULL,
        body TEXT NOT NULL,
        read_time INTEGER NOT NULL DEFAULT 5,
        published_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT "published",
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    )');

    if ($isNew) {
        importExistingPosts($pdo);
    }

    return $pdo;
}

// One-time import of the hand-written posts that already exist in /blog,
// so the admin panel and generator start from the real, current content.
function importExistingPosts(PDO $pdo) {
    $indexFile = BLOG_DIR . '/index.html';
    if (!file_exists($indexFile)) {
        return;
    }
    $indexHtml = file_get_contents($indexFile);

    $pattern = '/<a href="([a-z0-9\-]+)\.html" class="card blog-card reveal">\s*'
        . '<span class="badge badge-accent">(.*?)<\/span>\s*'
        . '<h3>(.*?)<\/h3>\s*'
        . '<p>(.*?)<\/p>\s*'
        . '<span class="blog-meta">(.*?)<\/span>\s*'
        . '<\/a>/s';

    if (!preg_match_all($pattern, $indexHtml, $matches, PREG_SET_ORDER)) {
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO posts
        (slug, title, category, excerpt, description, body, read_time, published_at, status, created_at, updated_at)
        VALUES (:slug, :title, :category, :excerpt, :description, :body, :read_time, :published_at, "published", :now, :now)');

    $now = date('c');

    foreach ($matches as $m) {
        $slug = $m[1];
        $category = trim($m[2]);
        $excerpt = trim($m[4]);
        $metaLine = trim($m[5]);

        $postFile = BLOG_DIR . '/' . $slug . '.html';
        if (!file_exists($postFile)) {
            continue;
        }
        $postHtml = file_get_contents($postFile);

        $title = '';
        if (preg_match('/<h1>(.*?)<\/h1>/s', $postHtml, $tm)) {
            $title = trim($tm[1]);
        }

        $description = '';
        if (preg_match('/<meta name="description" content="(.*?)">/s', $postHtml, $dm)) {
            $description = trim($dm[1]);
        }

        $body = '';
        if (preg_match('/<div class="blog-post-body">(.*?)<\/div>\s*<\/section>/s', $postHtml, $bm)) {
            $body = trim($bm[1]);
        }

        $publishedAt = date('Y-m-d');
        $readTime = 5;
        if (preg_match('/([A-Za-z]+ \d{1,2}, \d{4})\s*(?:&middot;|·)\s*(\d+)\s*min read/u', $metaLine, $mm)) {
            $d = DateTime::createFromFormat('F j, Y', $mm[1]);
            if ($d) {
                $publishedAt = $d->format('Y-m-d');
            }
            $readTime = (int) $mm[2];
        }

        if ($title === '' || $body === '') {
            continue;
        }

        $stmt->execute([
            ':slug' => $slug,
            ':title' => $title,
            ':category' => $category,
            ':excerpt' => $excerpt,
            ':description' => $description !== '' ? $description : $excerpt,
            ':body' => $body,
            ':read_time' => $readTime,
            ':published_at' => $publishedAt,
            ':now' => $now,
        ]);
    }
}
