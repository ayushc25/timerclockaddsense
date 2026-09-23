<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/layout_top.php';
require_once __DIR__ . '/includes/layout_bottom.php';

requireLogin();
$pdo = getDb();

$posts = $pdo->query('SELECT * FROM posts ORDER BY published_at DESC, id DESC')->fetchAll(PDO::FETCH_ASSOC);
$publishedCount = countPublishedPosts($pdo);

adminLayoutTop('Dashboard');
?>
<div class="admin-card">
  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-xs); flex-wrap: wrap; gap: var(--space-sm);">
    <h2 style="margin:0;">Blog posts</h2>
    <a href="post-form.php" class="btn btn-primary">+ New Post</a>
  </div>
  <p style="color: var(--color-ink-muted); font-size: var(--fs-sm); margin-bottom: var(--space-md);">
    <?= $publishedCount ?> / <?= MAX_PUBLISHED_POSTS ?> published slots used<?= $publishedCount >= MAX_PUBLISHED_POSTS ? ' — unpublish or delete one to add another live post.' : '' ?>
  </p>

  <?php if (empty($posts)): ?>
    <p style="color: var(--color-ink-muted);">No posts yet. Create your first one.</p>
  <?php else: ?>
  <div style="overflow-x:auto;">
  <table class="admin-table">
    <thead>
      <tr>
        <th>Title</th>
        <th>Category</th>
        <th>Status</th>
        <th>Published</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <?php foreach ($posts as $post): ?>
      <tr>
        <td>
          <strong><?= h($post['title']) ?></strong><br>
          <a href="../blog/<?= h($post['slug']) ?>.html" target="_blank" style="font-size: var(--fs-xs); color: var(--color-ink-muted);">/blog/<?= h($post['slug']) ?>.html</a>
        </td>
        <td><?= h($post['category']) ?></td>
        <td><span class="status-pill <?= h($post['status']) ?>"><?= h(ucfirst($post['status'])) ?></span></td>
        <td><?= h($post['published_at']) ?></td>
        <td>
          <div class="row-actions">
            <a href="post-form.php?id=<?= (int) $post['id'] ?>" class="btn btn-secondary btn-sm">Edit</a>
            <form method="post" action="delete-post.php" onsubmit="return confirm('Delete this post? This removes it from the database and deletes its published page.');">
              <?= csrfField() ?>
              <input type="hidden" name="id" value="<?= (int) $post['id'] ?>">
              <button type="submit" class="btn btn-ghost btn-sm" style="color:#b4432f;">Delete</button>
            </form>
          </div>
        </td>
      </tr>
      <?php endforeach; ?>
    </tbody>
  </table>
  </div>
  <?php endif; ?>
</div>
<?php adminLayoutBottom(); ?>
