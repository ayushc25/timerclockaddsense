<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/layout_top.php';
require_once __DIR__ . '/includes/layout_bottom.php';

$pdo = getDb();

if (hasAdminUser($pdo)) {
    header('Location: index.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireValidCsrf();
    $username = trim($_POST['username'] ?? '');
    $password = (string) ($_POST['password'] ?? '');
    $confirm = (string) ($_POST['confirm'] ?? '');

    if ($username === '' || strlen($username) < 3) {
        $error = 'Choose a username of at least 3 characters.';
    } elseif (strlen($password) < 10) {
        $error = 'Choose a password of at least 10 characters.';
    } elseif ($password !== $confirm) {
        $error = 'Passwords do not match.';
    } else {
        $stmt = $pdo->prepare('INSERT INTO admin_users (username, password_hash, created_at) VALUES (:u, :p, :now)');
        $stmt->execute([
            ':u' => $username,
            ':p' => password_hash($password, PASSWORD_DEFAULT),
            ':now' => date('c'),
        ]);
        session_regenerate_id(true);
        $_SESSION['admin_user_id'] = (int) $pdo->lastInsertId();
        $_SESSION['admin_username'] = $username;
        flash('Admin account created. Welcome in.');
        header('Location: dashboard.php');
        exit;
    }
}

adminLayoutTop('Create Admin Account', false);
?>
<div class="admin-auth-shell">
  <div class="admin-card">
    <h2 style="margin-bottom: var(--space-xs);">Create the admin account</h2>
    <p style="color: var(--color-ink-muted); font-size: var(--fs-sm); margin-bottom: var(--space-md);">This is a one-time setup screen. It only appears because no admin account exists yet.</p>
    <?php if ($error): ?><div class="admin-flash error"><?= h($error) ?></div><?php endif; ?>
    <form method="post" class="form-grid">
      <?= csrfField() ?>
      <div class="field">
        <label for="username">Username</label>
        <input class="input" type="text" id="username" name="username" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input class="input" type="password" id="password" name="password" autocomplete="new-password" minlength="10" required>
      </div>
      <div class="field">
        <label for="confirm">Confirm password</label>
        <input class="input" type="password" id="confirm" name="confirm" autocomplete="new-password" minlength="10" required>
      </div>
      <button type="submit" class="btn btn-primary btn-lg btn-block">Create account</button>
    </form>
  </div>
</div>
<?php adminLayoutBottom(); ?>
