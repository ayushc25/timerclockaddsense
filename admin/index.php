<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/layout_top.php';
require_once __DIR__ . '/includes/layout_bottom.php';

$pdo = getDb();

if (!hasAdminUser($pdo)) {
    header('Location: setup.php');
    exit;
}

if (isLoggedIn()) {
    header('Location: dashboard.php');
    exit;
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireValidCsrf();
    $username = trim($_POST['username'] ?? '');
    $password = (string) ($_POST['password'] ?? '');

    if (isLockedOut($pdo, clientIp())) {
        $error = 'Too many failed attempts. Try again in a few minutes.';
    } elseif (attemptLogin($pdo, $username, $password)) {
        header('Location: dashboard.php');
        exit;
    } else {
        $error = 'Incorrect username or password.';
    }
}

adminLayoutTop('Log In', false);
?>
<div class="admin-auth-shell">
  <div class="admin-card">
    <h2 style="margin-bottom: var(--space-md);">TimerHub Admin</h2>
    <?php if ($error): ?><div class="admin-flash error"><?= h($error) ?></div><?php endif; ?>
    <form method="post" class="form-grid">
      <?= csrfField() ?>
      <div class="field">
        <label for="username">Username</label>
        <input class="input" type="text" id="username" name="username" autocomplete="username" required autofocus>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input class="input" type="password" id="password" name="password" autocomplete="current-password" required>
      </div>
      <button type="submit" class="btn btn-primary btn-lg btn-block">Log in</button>
    </form>
  </div>
</div>
<?php adminLayoutBottom(); ?>
