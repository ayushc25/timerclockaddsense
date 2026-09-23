<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/render.php';

requireLogin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: dashboard.php');
    exit;
}

requireValidCsrf();
$pdo = getDb();

$id = (int) ($_POST['id'] ?? 0);
$title = trim($_POST['title'] ?? '');
$slugInput = trim($_POST['slug'] ?? '');
$category = trim($_POST['category'] ?? '');
$excerpt = trim($_POST['excerpt'] ?? '');
$description = trim($_POST['description'] ?? '');
$body = trim($_POST['body'] ?? '');
$readTime = max(1, (int) ($_POST['read_time'] ?? 5));
$publishedAt = trim($_POST['published_at'] ?? date('Y-m-d'));
$status = ($_POST['status'] ?? 'published') === 'draft' ? 'draft' : 'published';

if ($title === '' || $category === '' || $excerpt === '' || $description === '' || $body === '') {
    flash('Please fill in every field.', 'error');
    flashOldInput($_POST);
    header('Location: post-form.php' . ($id ? "?id={$id}" : ''));
    exit;
}

if (!DateTime::createFromFormat('Y-m-d', $publishedAt)) {
    $publishedAt = date('Y-m-d');
}

if ($status === 'published' && countPublishedPosts($pdo, $id ?: null) >= MAX_PUBLISHED_POSTS) {
    flash('Only ' . MAX_PUBLISHED_POSTS . ' published blog posts are allowed at a time. Unpublish or delete one first, or save this one as a draft.', 'error');
    flashOldInput($_POST);
    header('Location: post-form.php' . ($id ? "?id={$id}" : ''));
    exit;
}

$slugBase = slugify($slugInput !== '' ? $slugInput : $title);
$slug = uniqueSlug($pdo, $slugBase, $id ?: null);

$now = date('c');

if ($id) {
    $stmt = $pdo->prepare('UPDATE posts SET slug=:slug, title=:title, category=:category, excerpt=:excerpt,
        description=:description, body=:body, read_time=:read_time, published_at=:published_at,
        status=:status, updated_at=:now WHERE id=:id');
    $stmt->execute([
        ':slug' => $slug, ':title' => $title, ':category' => $category, ':excerpt' => $excerpt,
        ':description' => $description, ':body' => $body, ':read_time' => $readTime,
        ':published_at' => $publishedAt, ':status' => $status, ':now' => $now, ':id' => $id,
    ]);
} else {
    $stmt = $pdo->prepare('INSERT INTO posts
        (slug, title, category, excerpt, description, body, read_time, published_at, status, created_at, updated_at)
        VALUES (:slug, :title, :category, :excerpt, :description, :body, :read_time, :published_at, :status, :now, :now)');
    $stmt->execute([
        ':slug' => $slug, ':title' => $title, ':category' => $category, ':excerpt' => $excerpt,
        ':description' => $description, ':body' => $body, ':read_time' => $readTime,
        ':published_at' => $publishedAt, ':status' => $status, ':now' => $now,
    ]);
}

publishAll($pdo);

flash('Post saved and the site has been regenerated.');
header('Location: dashboard.php');
exit;
