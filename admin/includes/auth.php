<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

const LOGIN_MAX_ATTEMPTS = 8;
const LOGIN_LOCKOUT_WINDOW = 900; // 15 minutes

function hasAdminUser(PDO $pdo) {
    return (int) $pdo->query('SELECT COUNT(*) FROM admin_users')->fetchColumn() > 0;
}

function isLoggedIn() {
    return !empty($_SESSION['admin_user_id']);
}

function requireLogin() {
    $pdo = getDb();
    if (!hasAdminUser($pdo)) {
        header('Location: setup.php');
        exit;
    }
    if (!isLoggedIn()) {
        header('Location: index.php');
        exit;
    }
}

function clientIp() {
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// Counts failed attempts from this IP within the lockout window. Persisted
// in SQLite so it survives cleared cookies/sessions, unlike a session counter.
function recentFailedAttempts(PDO $pdo, $ip) {
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = :ip AND attempted_at > :since');
    $stmt->execute([':ip' => $ip, ':since' => time() - LOGIN_LOCKOUT_WINDOW]);
    return (int) $stmt->fetchColumn();
}

function recordFailedAttempt(PDO $pdo, $ip) {
    $stmt = $pdo->prepare('INSERT INTO login_attempts (ip, attempted_at) VALUES (:ip, :t)');
    $stmt->execute([':ip' => $ip, ':t' => time()]);
    // Occasionally sweep old rows so the table doesn't grow forever.
    if (mt_rand(1, 20) === 1) {
        $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at <= :since')
            ->execute([':since' => time() - LOGIN_LOCKOUT_WINDOW]);
    }
}

function clearFailedAttempts(PDO $pdo, $ip) {
    $pdo->prepare('DELETE FROM login_attempts WHERE ip = :ip')->execute([':ip' => $ip]);
}

function isLockedOut(PDO $pdo, $ip) {
    return recentFailedAttempts($pdo, $ip) >= LOGIN_MAX_ATTEMPTS;
}

function attemptLogin(PDO $pdo, $username, $password) {
    $ip = clientIp();

    if (isLockedOut($pdo, $ip)) {
        usleep(500000);
        return false;
    }

    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE username = :username');
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        clearFailedAttempts($pdo, $ip);
        session_regenerate_id(true);
        $_SESSION['admin_user_id'] = $user['id'];
        $_SESSION['admin_username'] = $user['username'];
        return true;
    }

    recordFailedAttempt($pdo, $ip);
    return false;
}
