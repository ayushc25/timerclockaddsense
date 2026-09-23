<?php
// Central paths and settings for the admin panel.

define('ADMIN_ROOT', __DIR__ . '/..');
define('SITE_ROOT', ADMIN_ROOT . '/..');
define('BLOG_DIR', SITE_ROOT . '/blog');
define('SITEMAP_FILE', SITE_ROOT . '/sitemap.xml');
define('DB_FILE', ADMIN_ROOT . '/data/blog.db');
define('SITE_URL', 'https://timerhub.niraktech.com');
define('MAX_PUBLISHED_POSTS', 3);

$isLocalHost = in_array($_SERVER['HTTP_HOST'] ?? '', ['localhost', '127.0.0.1'], true)
    || preg_match('/^(localhost|127\.0\.0\.1):\d+$/', $_SERVER['HTTP_HOST'] ?? '');
$isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';

// Force HTTPS in production; never redirect the local dev server.
if (!$isLocalHost && !$isHttps && php_sapi_name() !== 'cli') {
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'], true, 301);
    exit;
}

// Never leak stack traces / file paths to the browser. Log them instead.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('error_log', ADMIN_ROOT . '/data/php-error.log');
error_reporting(E_ALL);

// Basic session hardening.
ini_set('session.use_strict_mode', 1);
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/admin/',
    'httponly' => true,
    'secure' => $isHttps,
    'samesite' => 'Lax',
]);
session_name('timerhub_admin');
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Baseline hardening headers for every admin response.
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data:;");
