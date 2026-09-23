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
$stmt = $pdo->prepare('SELECT COUNT(*) FROM posts WHERE id = :id');
$stmt->execute([':id' => $id]);

if ((int) $stmt->fetchColumn() > 0) {
    $del = $pdo->prepare('DELETE FROM posts WHERE id = :id');
    $del->execute([':id' => $id]);
    publishAll($pdo);
    flash('Post deleted.');
} else {
    flash('Post not found.', 'error');
}

header('Location: dashboard.php');
exit;
