<?php

function h($value) {
    return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
}

function slugify($text) {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text === '' ? 'post' : $text;
}

function uniqueSlug(PDO $pdo, $slug, $excludeId = null) {
    $base = $slug;
    $i = 2;
    while (true) {
        $sql = 'SELECT COUNT(*) FROM posts WHERE slug = :slug';
        if ($excludeId !== null) {
            $sql .= ' AND id != :id';
        }
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':slug', $slug);
        if ($excludeId !== null) {
            $stmt->bindValue(':id', $excludeId);
        }
        $stmt->execute();
        if ((int) $stmt->fetchColumn() === 0) {
            return $slug;
        }
        $slug = $base . '-' . $i;
        $i++;
    }
}

function countPublishedPosts(PDO $pdo, $excludeId = null) {
    $sql = "SELECT COUNT(*) FROM posts WHERE status = 'published'";
    if ($excludeId !== null) {
        $sql .= ' AND id != :id';
    }
    $stmt = $pdo->prepare($sql);
    if ($excludeId !== null) {
        $stmt->bindValue(':id', $excludeId);
    }
    $stmt->execute();
    return (int) $stmt->fetchColumn();
}

function csrfToken() {
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function csrfField() {
    return '<input type="hidden" name="csrf_token" value="' . h(csrfToken()) . '">';
}

function requireValidCsrf() {
    $token = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(400);
        exit('Invalid or expired form submission. Go back and try again.');
    }
}

function flash($message, $type = 'success') {
    $_SESSION['flash'] = ['message' => $message, 'type' => $type];
}

function getFlash() {
    if (empty($_SESSION['flash'])) {
        return null;
    }
    $flash = $_SESSION['flash'];
    unset($_SESSION['flash']);
    return $flash;
}

function flashOldInput(array $data) {
    $_SESSION['old_input'] = $data;
}

function getOldInput() {
    if (empty($_SESSION['old_input'])) {
        return null;
    }
    $data = $_SESSION['old_input'];
    unset($_SESSION['old_input']);
    return $data;
}

function formatMetaLine($publishedAt, $readTime) {
    $date = DateTime::createFromFormat('Y-m-d', $publishedAt);
    $dateLabel = $date ? $date->format('F j, Y') : $publishedAt;
    return $dateLabel . ' · ' . (int) $readTime . ' min read';
}
