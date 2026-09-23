<?php
/**
 * @param string $pageTitle
 * @param bool $showNav
 */
function adminLayoutTop($pageTitle, $showNav = true) {
    $flash = getFlash();
    ?>
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title><?= h($pageTitle) ?> — TimerHub Admin</title>
<link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.snow.css" integrity="sha384-cPa8kzsYWhqpAfWOLWYIw3V0BhPi/m3lrd8tBTPxr2NrYCHRVZ7xy1cEoRGOM/03" crossorigin="anonymous">
<link rel="stylesheet" href="../css/variables.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/components.css">
<style>
  body { background: var(--color-bg-alt); }
  .admin-shell { max-width: 960px; margin: 0 auto; padding: var(--space-lg) var(--space-md) var(--space-xl); }
  .admin-topbar { display: flex; align-items: center; justify-content: space-between; gap: var(--space-md); padding-block: var(--space-md); flex-wrap: wrap; }
  .admin-topbar .brand { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-lg); color: var(--color-ink); text-decoration: none; }
  .admin-topbar nav { display: flex; gap: var(--space-sm); flex-wrap: wrap; }
  .admin-flash { padding: var(--space-sm) var(--space-md); border-radius: var(--radius-md); margin-bottom: var(--space-md); font-size: var(--fs-sm); font-weight: 600; }
  .admin-flash.success { background: #e4f5e9; color: #1f7a44; }
  .admin-flash.error { background: #fbe7e5; color: #b4432f; }
  .admin-card { background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-lg); }
  table.admin-table { width: 100%; border-collapse: collapse; }
  table.admin-table th, table.admin-table td { text-align: left; padding: var(--space-sm) var(--space-xs); border-bottom: 1px solid var(--color-border); font-size: var(--fs-sm); vertical-align: middle; }
  table.admin-table th { color: var(--color-ink-muted); text-transform: uppercase; font-size: var(--fs-xs); letter-spacing: .03em; }
  .status-pill { display: inline-block; padding: 0.2em 0.7em; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; }
  .status-pill.published { background: #e4f5e9; color: #1f7a44; }
  .status-pill.draft { background: #f2ede6; color: var(--color-ink-muted); }
  .row-actions { display: flex; gap: var(--space-xs); flex-wrap: wrap; }
  .admin-auth-shell { max-width: 380px; margin: 10vh auto 0; padding: 0 var(--space-md); }
  #editor { max-width: 100%; }
  .ql-editor { min-height: 320px; }
  @media (max-width: 640px) {
    .admin-shell { padding: var(--space-md) var(--space-sm) var(--space-lg); }
    .admin-topbar { justify-content: center; text-align: center; }
    .admin-topbar nav { justify-content: center; width: 100%; }
    .admin-card { padding: var(--space-md); }
    table.admin-table th, table.admin-table td { padding: var(--space-xs); font-size: var(--fs-xs); }
    .admin-auth-shell { margin-top: var(--space-xl); }
  }
</style>
</head>
<body>
<div class="admin-shell">
  <?php if ($showNav): ?>
  <div class="admin-topbar">
    <a href="dashboard.php" class="brand">TimerHub Admin</a>
    <nav>
      <a href="dashboard.php" class="btn btn-ghost btn-sm">Dashboard</a>
      <a href="post-form.php" class="btn btn-ghost btn-sm">New Post</a>
      <a href="change-password.php" class="btn btn-ghost btn-sm">Password</a>
      <a href="logout.php" class="btn btn-secondary btn-sm">Log out</a>
    </nav>
  </div>
  <?php endif; ?>
  <?php if ($flash): ?>
    <div class="admin-flash <?= h($flash['type']) ?>"><?= h($flash['message']) ?></div>
  <?php endif; ?>
<?php
}
