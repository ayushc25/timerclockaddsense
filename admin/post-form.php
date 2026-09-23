<?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/db.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/helpers.php';
require_once __DIR__ . '/includes/layout_top.php';
require_once __DIR__ . '/includes/layout_bottom.php';

requireLogin();
$pdo = getDb();

$id = isset($_GET['id']) ? (int) $_GET['id'] : null;
$post = [
    'id' => null,
    'slug' => '',
    'title' => '',
    'category' => '',
    'excerpt' => '',
    'description' => '',
    'body' => '',
    'read_time' => 5,
    'published_at' => date('Y-m-d'),
    'status' => 'published',
];

if ($id) {
    $stmt = $pdo->prepare('SELECT * FROM posts WHERE id = :id');
    $stmt->execute([':id' => $id]);
    $found = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$found) {
        flash('Post not found.', 'error');
        header('Location: dashboard.php');
        exit;
    }
    $post = $found;
}

$old = getOldInput();
if ($old) {
    $post = array_merge($post, $old);
}

$otherPublishedCount = countPublishedPosts($pdo, $id ?: null);
$atLimit = $otherPublishedCount >= MAX_PUBLISHED_POSTS;

adminLayoutTop($id ? 'Edit Post' : 'New Post');
?>
<div class="admin-card">
  <h2 style="margin-bottom: var(--space-md);"><?= $id ? 'Edit post' : 'New post' ?></h2>

  <form method="post" action="save-post.php" class="form-grid">
    <?= csrfField() ?>
    <input type="hidden" name="id" value="<?= (int) ($post['id'] ?? 0) ?>">

    <div class="field">
      <label for="title">Title</label>
      <input class="input" type="text" id="title" name="title" value="<?= h($post['title']) ?>" required>
    </div>

    <div class="field">
      <label for="slug">URL slug <span style="color: var(--color-ink-muted); font-weight: 400;">(used as /blog/&lt;slug&gt;.html — leave blank to auto-generate from the title)</span></label>
      <input class="input" type="text" id="slug" name="slug" value="<?= h($post['slug']) ?>" placeholder="auto-generated-from-title">
    </div>

    <div class="form-row-2">
      <div class="field">
        <label for="category">Category / badge</label>
        <input class="input" type="text" id="category" name="category" value="<?= h($post['category']) ?>" placeholder="Productivity, Fitness, Focus…" required>
      </div>
      <div class="field">
        <label for="status">Status <span style="color: var(--color-ink-muted); font-weight: 400;">(<?= $otherPublishedCount ?>/<?= MAX_PUBLISHED_POSTS ?> other slots published)</span></label>
        <select class="select" id="status" name="status">
          <option value="published" <?= $post['status'] === 'published' ? 'selected' : '' ?> <?= $atLimit ? 'disabled' : '' ?>>Published<?= $atLimit ? ' (limit reached)' : '' ?></option>
          <option value="draft" <?= $post['status'] === 'draft' ? 'selected' : '' ?>>Draft (not shown on the site)</option>
        </select>
        <?php if ($atLimit): ?>
          <span style="color:#b4432f; font-size: var(--fs-xs);">Only <?= MAX_PUBLISHED_POSTS ?> published posts are allowed at once. Unpublish or delete one to publish this instead.</span>
        <?php endif; ?>
      </div>
    </div>

    <div class="form-row-2">
      <div class="field">
        <label for="published_at">Published date</label>
        <input class="input" type="date" id="published_at" name="published_at" value="<?= h($post['published_at']) ?>" required>
      </div>
      <div class="field">
        <label for="read_time">Read time (minutes)</label>
        <input class="input" type="number" id="read_time" name="read_time" min="1" max="60" value="<?= (int) $post['read_time'] ?>" required>
      </div>
    </div>

    <div class="field">
      <label for="excerpt">Card excerpt <span style="color: var(--color-ink-muted); font-weight: 400;">(shown on the blog listing card)</span></label>
      <textarea class="input" id="excerpt" name="excerpt" rows="2" required><?= h($post['excerpt']) ?></textarea>
    </div>

    <div class="field">
      <label for="description">Meta description <span style="color: var(--color-ink-muted); font-weight: 400;">(for search engines, ~155 characters)</span></label>
      <textarea class="input" id="description" name="description" rows="2" required><?= h($post['description']) ?></textarea>
    </div>

    <div class="field">
      <label for="editor">Post content</label>
      <div id="editor" style="background:#fff; min-height:360px;"><?= $post['body'] ?></div>
      <textarea name="body" id="body" style="display:none;"></textarea>
    </div>

    <div style="display:flex; gap: var(--space-sm);">
      <button type="submit" class="btn btn-primary btn-lg">Save &amp; Publish</button>
      <a href="dashboard.php" class="btn btn-ghost btn-lg">Cancel</a>
    </div>
  </form>
</div>
<script src="https://cdn.jsdelivr.net/npm/quill@1.3.7/dist/quill.min.js" integrity="sha384-QUJ+ckWz1M+a7w0UfG1sEn4pPrbQwSxGm/1TIPyioqXBrwuT9l4f9gdHWLDLbVWI" crossorigin="anonymous"></script>
<script>
  var quill = new Quill('#editor', {
    theme: 'snow',
    placeholder: 'Write the post here…',
    modules: {
      toolbar: [
        [{ header: 2 }, false],
        ['bold', 'italic'],
        ['link', 'blockquote'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ]
    }
  });
  document.querySelector('form').addEventListener('submit', function () {
    document.getElementById('body').value = quill.root.innerHTML;
  });
</script>
<?php adminLayoutBottom(); ?>
