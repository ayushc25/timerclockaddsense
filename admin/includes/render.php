<?php
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

function renderPostPage(array $post) {
    $title = h($post['title']);
    $description = h($post['description']);
    $category = h($post['category']);
    $metaLine = formatMetaLine($post['published_at'], $post['read_time']);
    $body = $post['body']; // trusted admin-authored HTML, not escaped

    $slug = h($post['slug']);
    $canonical = SITE_URL . '/blog/' . $slug . '.html';
    $ogImage = SITE_URL . '/assets/icons/icon-512.png';
    $publishedIso = h($post['published_at']) . 'T08:00:00+00:00';
    $modifiedIso = h(substr($post['updated_at'] ?? $post['published_at'], 0, 10)) . 'T08:00:00+00:00';
    $jsonLdDescription = json_encode($post['description'], JSON_UNESCAPED_SLASHES);
    $jsonLdTitle = json_encode($post['title'], JSON_UNESCAPED_SLASHES);

    return <<<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{$title} — TimerHub Journal</title>
<meta name="description" content="{$description}">
<link rel="canonical" href="{$canonical}">
<link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#B4633A">

<meta property="og:type" content="article">
<meta property="og:site_name" content="TimerHub">
<meta property="og:title" content="{$title}">
<meta property="og:description" content="{$description}">
<meta property="og:url" content="{$canonical}">
<meta property="og:image" content="{$ogImage}">
<meta property="article:published_time" content="{$publishedIso}">
<meta property="article:modified_time" content="{$modifiedIso}">
<meta property="article:section" content="{$category}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{$title}">
<meta name="twitter:description" content="{$description}">
<meta name="twitter:image" content="{$ogImage}">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": {$jsonLdTitle},
  "description": {$jsonLdDescription},
  "datePublished": "{$publishedIso}",
  "dateModified": "{$modifiedIso}",
  "mainEntityOfPage": { "@type": "WebPage", "@id": "{$canonical}" },
  "image": ["{$ogImage}"],
  "publisher": {
    "@type": "Organization",
    "name": "TimerHub",
    "logo": { "@type": "ImageObject", "url": "{$ogImage}" }
  }
}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/variables.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/components.css">
<link rel="stylesheet" href="../css/timer.css">
<link rel="stylesheet" href="../css/home.css">
<script>
  (function(){
    try {
      var t = localStorage.getItem('timerhub_theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.setAttribute('data-theme', 'light');
    } catch(e){}
  })();
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098448277553816" crossorigin="anonymous"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="header-inner">
    <a href="../index.html" class="brand">
      <svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 2h6M12 2v2" stroke-linecap="round"/></svg>
      TimerHub
    </a>
    <nav class="main-nav" aria-label="Primary">
      <div class="nav-links">
        <a href="../tools/index.html">Tools</a>
        <a href="../routines/index.html">Routines</a>
        <a href="../templates/index.html">Templates</a>
        <a href="../blog/index.html" aria-current="page">Blog</a>
      </div>
    </nav>
    <div class="header-actions">
      <a href="../tools/timer.html" class="btn btn-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>
        Start Timer
      </a>
      <button class="menu-toggle" aria-label="Open menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>

<div class="mobile-drawer" id="mobile-drawer">
  <div class="mobile-drawer-header">
    <button type="button" class="drawer-back-btn" data-drawer-close aria-label="Back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      <span>Back</span>
    </button>
    <span class="drawer-title">Menu</span>
  </div>
  <nav aria-label="Mobile">
    <a href="../tools/index.html">Tools</a>
    <a href="../routines/index.html">Routines</a>
    <a href="../templates/index.html">Templates</a>
    <a href="../blog/index.html">Blog</a>
  </nav>
  <a href="../tools/timer.html" class="btn btn-accent btn-block btn-lg">Start Timer</a>
</div>

<main id="main">

  <section class="page-header container">
    <div class="page-back-nav">
      <a href="index.html" class="page-back-btn" data-back-btn aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>Back</span>
      </a>
    </div>
    <span class="badge badge-accent">{$category}</span>
    <h1>{$title}</h1>
    <p class="blog-meta">{$metaLine}</p>
  </section>

  <section class="container" style="padding-block: 0 var(--space-lg);">
    <div class="ad-slot ad-slot-wide" role="complementary" aria-label="Advertisement placeholder"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7098448277553816" data-ad-slot="7380709218" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>
  </section>

  <section class="section container">
    <div class="blog-post-body">
      {$body}
    </div>
  </section>

  <section class="container" style="padding-block: 0 var(--space-xl);">
    <div class="ad-slot ad-slot-wide" role="complementary" aria-label="Advertisement placeholder"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7098448277553816" data-ad-slot="7380709218" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>
  </section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="../index.html" class="brand">
          <svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 2h6M12 2v2" stroke-linecap="round"/></svg>
          TimerHub
        </a>
        <p>Simple, beautiful online tools for managing time — focus, fitness, cooking, meetings and everyday life.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="../tools/index.html">Tools</a></li>
          <li><a href="../routines/index.html">Routines</a></li>
          <li><a href="../templates/index.html">Templates</a></li>
          <li><a href="../blog/index.html">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="../about.html">About</a></li>
          <li><a href="../contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="../privacy.html">Privacy Policy</a></li>
          <li><a href="../terms.html">Terms &amp; Conditions</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year></span> TimerHub. All rights reserved. &bull; <a href="https://niraktech.com/" target="_blank" rel="noopener noreferrer" class="footer-product-link">A product of Nirak Tech</a></span>
      <span>Built for focused people, everywhere.</span>
    </div>
  </div>
</footer>

<script src="../js/lib/audio.js"></script>
<script src="../js/lib/timeutils.js"></script>
<script src="../js/main.js"></script>
</body>
</html>
HTML;
}

function renderBlogCard(array $post) {
    $slug = h($post['slug']);
    $category = h($post['category']);
    $title = h($post['title']);
    $excerpt = h($post['excerpt']);
    $metaLine = formatMetaLine($post['published_at'], $post['read_time']);

    return <<<HTML
      <a href="{$slug}.html" class="card blog-card reveal">
        <span class="badge badge-accent">{$category}</span>
        <h3>{$title}</h3>
        <p>{$excerpt}</p>
        <span class="blog-meta">{$metaLine}</span>
      </a>
HTML;
}

function renderBlogIndex(array $posts) {
    $cards = implode("\n\n", array_map('renderBlogCard', $posts));
    $indexUrl = SITE_URL . '/blog/index.html';
    $ogImage = SITE_URL . '/assets/icons/icon-512.png';

    return <<<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The TimerHub Journal — Blog</title>
<meta name="description" content="Practical writing on focus, productivity and time management — and how to get the most out of TimerHub's tools, from Pomodoro to interval training.">
<link rel="canonical" href="{$indexUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="TimerHub">
<meta property="og:title" content="The TimerHub Journal — Blog">
<meta property="og:description" content="Practical writing on focus, productivity and time management — and how to get the most out of TimerHub's tools.">
<meta property="og:url" content="{$indexUrl}">
<meta property="og:image" content="{$ogImage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="../assets/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/icons/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/icons/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/icons/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#B4633A">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../css/variables.css">
<link rel="stylesheet" href="../css/base.css">
<link rel="stylesheet" href="../css/components.css">
<link rel="stylesheet" href="../css/timer.css">
<link rel="stylesheet" href="../css/home.css">
<script>
  (function(){
    try {
      var t = localStorage.getItem('timerhub_theme');
      if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.setAttribute('data-theme', 'light');
    } catch(e){}
  })();
</script>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098448277553816" crossorigin="anonymous"></script>
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header">
  <div class="header-inner">
    <a href="../index.html" class="brand">
      <svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 2h6M12 2v2" stroke-linecap="round"/></svg>
      TimerHub
    </a>
    <nav class="main-nav" aria-label="Primary">
      <div class="nav-links">
        <a href="../tools/index.html">Tools</a>
        <a href="../routines/index.html">Routines</a>
        <a href="../templates/index.html">Templates</a>
        <a href="../blog/index.html" aria-current="page">Blog</a>
      </div>
    </nav>
    <div class="header-actions">
      <button class="theme-toggle-btn" type="button" aria-label="Toggle dark/light theme" title="Toggle theme (Alt+T)">
        <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
        <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
      </button>
      <a href="../tools/timer.html" class="btn btn-accent">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 5v14l11-7z"/></svg>
        Start Timer
      </a>
      <button class="menu-toggle" aria-label="Open menu" aria-expanded="false">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
      </button>
    </div>
  </div>
</header>

<div class="mobile-drawer" id="mobile-drawer">
  <div class="mobile-drawer-header">
    <button type="button" class="drawer-back-btn" data-drawer-close aria-label="Back">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      <span>Back</span>
    </button>
    <span class="drawer-title">Menu</span>
  </div>
  <nav aria-label="Mobile">
    <a href="../tools/index.html">Tools</a>
    <a href="../routines/index.html">Routines</a>
    <a href="../templates/index.html">Templates</a>
    <a href="../blog/index.html">Blog</a>
  </nav>
  <div style="display: flex; align-items: center; justify-content: space-between; padding-block: var(--space-xs);">
    <span style="font-size: var(--fs-sm); font-weight: 600;">Theme</span>
    <button class="theme-toggle-btn" type="button" aria-label="Toggle theme">
      <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
      <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
    </button>
  </div>
  <a href="../tools/timer.html" class="btn btn-accent btn-block btn-lg">Start Timer</a>
</div>

<main id="main">

  <section class="page-header container">
    <div class="page-back-nav">
      <a href="../index.html" class="page-back-btn" data-back-btn aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        <span>Back</span>
      </a>
    </div>
    <span class="eyebrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M5 12l5 5L20 7"/></svg>
      The TimerHub Journal
    </span>
    <h1>Writing on focus, time and getting things done</h1>
    <p class="lede">Practical, no-nonsense articles on focus, productivity and time management — and how to get the most out of TimerHub's tools.</p>
  </section>

  <section class="container" style="padding-block: 0 var(--space-xl);">
    <div class="ad-slot ad-slot-wide" role="complementary" aria-label="Advertisement placeholder"><ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-7098448277553816" data-ad-slot="7380709218" data-ad-format="auto" data-full-width-responsive="true"></ins><script>(adsbygoogle = window.adsbygoogle || []).push({});</script></div>
  </section>

  <section class="section container">
    <div class="blog-grid">

{$cards}

    </div>
  </section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="../index.html" class="brand">
          <svg class="brand-mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 2h6M12 2v2" stroke-linecap="round"/></svg>
          TimerHub
        </a>
        <p>Simple, beautiful online tools for managing time — focus, fitness, cooking, meetings and everyday life.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="../tools/index.html">Tools</a></li>
          <li><a href="../routines/index.html">Routines</a></li>
          <li><a href="../templates/index.html">Templates</a></li>
          <li><a href="../blog/index.html">Blog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="../about.html">About</a></li>
          <li><a href="../contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="../privacy.html">Privacy Policy</a></li>
          <li><a href="../terms.html">Terms &amp; Conditions</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>&copy; <span data-year></span> TimerHub. All rights reserved. &bull; <a href="https://niraktech.com/" target="_blank" rel="noopener noreferrer" class="footer-product-link">A product of Nirak Tech</a></span>
      <span>Built for focused people, everywhere.</span>
    </div>
  </div>
</footer>

<script src="../js/lib/audio.js"></script>
<script src="../js/lib/timeutils.js"></script>
<script src="../js/main.js"></script>
</body>
</html>
HTML;
}

function updateSitemapBlogUrls(array $posts) {
    if (!file_exists(SITEMAP_FILE)) {
        return;
    }
    $xml = file_get_contents(SITEMAP_FILE);

    $blocks = [];
    $now = date('c');
    foreach ($posts as $post) {
        $loc = SITE_URL . '/blog/' . h($post['slug']) . '.html';
        $blocks[] = "  <url>\n       <loc>{$loc}</loc>\n       <lastmod>{$now}</lastmod>\n       <priority>0.6400</priority>\n  </url>";
    }
    $replacement = "<!-- BLOG_URLS_START -->\n" . implode("\n", $blocks) . "\n  <!-- BLOG_URLS_END -->";

    $updated = preg_replace(
        '/<!-- BLOG_URLS_START -->.*?<!-- BLOG_URLS_END -->/s',
        $replacement,
        $xml,
        1,
        $count
    );

    if ($count > 0) {
        file_put_contents(SITEMAP_FILE, $updated);
    }
}

// Regenerates every published post's static HTML file, the blog index, and
// the sitemap's blog entries, from whatever is currently in the database.
// Any leftover blog/*.html file that no longer matches a published post
// (deleted, unpublished, or renamed) is removed automatically.
function publishAll(PDO $pdo) {
    $stmt = $pdo->query("SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC, id DESC");
    $published = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $keepSlugs = array_map(function ($p) { return $p['slug']; }, $published);
    foreach (glob(BLOG_DIR . '/*.html') as $file) {
        $slug = basename($file, '.html');
        if ($slug === 'index') {
            continue;
        }
        if (!in_array($slug, $keepSlugs, true)) {
            unlink($file);
        }
    }

    foreach ($published as $post) {
        file_put_contents(BLOG_DIR . '/' . $post['slug'] . '.html', renderPostPage($post));
    }

    file_put_contents(BLOG_DIR . '/index.html', renderBlogIndex($published));
    updateSitemapBlogUrls($published);
}
