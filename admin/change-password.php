<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/layout_top.php';
require_once __DIR__ . '/includes/layout_bottom.php';

requireLogin();
$pdo = getDb();

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireValidCsrf();
    $current = (string) ($_POST['current_password'] ?? '');
    $new = (string) ($_POST['new_password'] ?? '');
    $confirm = (string) ($_POST['confirm_password'] ?? '');

    $stmt = $pdo->prepare('SELECT * FROM admin_users WHERE id = :id');
    $stmt->execute([':id' => $_SESSION['admin_user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($current, $user['password_hash'])) {
        $error = 'Current password is incorrect.';
    } elseif (strlen($new) < 10) {
        $error = 'New password must be at least 10 characters.';
    } elseif ($new !== $confirm) {
        $error = 'New passwords do not match.';
    } else {
        $upd = $pdo->prepare('UPDATE admin_users SET password_hash = :hash WHERE id = :id');
        $upd->execute([':hash' => password_hash($new, PASSWORD_DEFAULT), ':id' => $user['id']]);
        flash('Password updated.');
        header('Location: dashboard.php');
        exit;
    }
}

adminLayoutTop('Change Password');
?>
<div class="admin-card" style="max-width: 420px;">
  <h2 style="margin-bottom: var(--space-md);">Change password</h2>
  <?php if ($error): ?><div class="admin-flash error"><?= h($error) ?></div><?php endif; ?>
  <form method="post" class="form-grid">
    <?= csrfField() ?>
    <div class="field">
      <label for="current_password">Current password</label>
      <input class="input" type="password" id="current_password" name="current_password" autocomplete="current-password" required>
    </div>
    <div class="field">
      <label for="new_password">New password</label>
      <input class="input" type="password" id="new_password" name="new_password" autocomplete="new-password" minlength="10" required>
    </div>
    <div class="field">
      <label for="confirm_password">Confirm new password</label>
      <input class="input" type="password" id="confirm_password" name="confirm_password" autocomplete="new-password" minlength="10" required>
    </div>
    <button type="submit" class="btn btn-primary btn-lg">Update password</button>
  </form>
</div>
<?php adminLayoutBottom(); ?>
