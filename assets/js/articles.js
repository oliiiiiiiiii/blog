// assets/js/articles.js

// Global variable to store posts
let allPosts = [];

// Fetch and build posts list from static index (works on GitHub Pages)
async function loadPostsFromStaticIndex() {
  const indexRes = await fetch('./posts/index.json', { cache: 'no-store' });
  if (!indexRes.ok) throw new Error('Failed to load posts index');
  const files = await indexRes.json(); // ["file.md", ...]

  const posts = [];
  // Load each markdown and parse front matter
  await Promise.all(files.map(async (filename) => {
    const slug = filename.replace(/\.md$/i, '');
    const res = await fetch(`./posts/${filename}`, { cache: 'no-store' });
    if (!res.ok) return;
    const markdown = await res.text();
    const { meta, content } = parseFrontMatter(markdown);
    posts.push({
      slug,
      title: meta.title || 'Untitled',
      date: meta.date || '',
      category: meta.category || null,
      tags: Array.isArray(meta.tags) ? meta.tags : (typeof meta.tags === 'string' && meta.tags ? meta.tags.split(',').map(t=>t.trim()).filter(Boolean) : []),
      summary: meta.summary || '',
      content
    });
  }));

  // Sort newest first if dates present
  posts.sort((a,b) => (new Date(b.date) - new Date(a.date)));
  return posts;
}

// Simple front matter parser (YAML-like minimal)
function parseFrontMatter(markdown) {
  const fmMatch = markdown.match(/^---\s*[\r\n]([\s\S]*?)\n---\s*[\r\n]([\s\S]*)$/);
  if (!fmMatch) return { meta: {}, content: markdown };
  const yaml = fmMatch[1];
  const content = fmMatch[2];
  const meta = {};
  yaml.split(/\r?\n/).forEach(line => {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (!m) return;
    const key = m[1].trim();
    let value = m[2].trim();
    if (/^\[.*\]$/.test(value)) {
      value = value.replace(/[\[\]]/g, '').split(',').map(v => v.trim()).filter(Boolean);
    }
    meta[key] = value;
  });
  return { meta, content };
}

// Initialize articles page functionality
async function initializeArticlesPage() {
  try {
    // Load posts statically from the repo (no PHP required)
    allPosts = await loadPostsFromStaticIndex();

    // Extract unique categories
    const categories = new Set();
    allPosts.forEach((post) => {
      if (post.category) {
        categories.add(post.category);
      }
    });

    // Priority order: All, CS, Life, then others alphabetically
    const priority = ["All", "CS", "Life"];
    const otherCategories = Array.from(categories)
      .filter((c) => !priority.includes(c))
      .sort((a, b) => a.localeCompare(b));
    const categoryList = ["All", ...priority.filter(c => c !== "All" && categories.has(c)), ...otherCategories];

    renderCategoryButtons(categoryList);
    renderArticles(allPosts); // Show all articles by default

  } catch (error) {
    console.error('Error loading articles:', error);
    const container = document.getElementById('articles-container');
    if (container) {
      container.innerHTML = '<p class="text-red-500 text-center">Error loading articles. Please try again later.</p>';
    }
  }
}

// Render category filter buttons
function renderCategoryButtons(categories) {
  const container = document.getElementById("category-buttons");
  if (!container) return;
  
  container.innerHTML = "";
  
  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.dataset.category = category;
    btn.className = "category-button px-6 py-2 rounded-full text-sm font-medium mr-4 mb-2 transition-all duration-200";
    
    // Style for active/inactive states
    if (category === "All") {
      btn.classList.add("bg-blue-600", "text-white", "shadow-md");
    } else {
      btn.classList.add("bg-gray-100", "text-gray-700", "hover:bg-gray-200");
    }
    
    // Add click event
    btn.addEventListener("click", () => {
      // Update button states
      document.querySelectorAll(".category-button").forEach((b) => {
        b.classList.remove("bg-blue-600", "text-white", "shadow-md");
        b.classList.add("bg-gray-100", "text-gray-700");
      });
      
      btn.classList.remove("bg-gray-100", "text-gray-700");
      btn.classList.add("bg-blue-600", "text-white", "shadow-md");

      // Filter and render posts
      const filteredPosts = category === "All" 
        ? allPosts 
        : allPosts.filter((post) => post.category === category);
      
      renderArticles(filteredPosts);
    });
    
    container.appendChild(btn);
  });
}

// Render articles in card format
function renderArticles(posts) {
  const container = document.getElementById("articles-container");
  if (!container) return;
  
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">No articles found in this category.</p>
      </div>
    `;
    return;
  }

  posts.forEach((post) => {
    const article = document.createElement("article");
    article.className = "bg-white rounded-xl shadow-sm p-8 hover:shadow-lg transition-all duration-300 border border-gray-100";

    // Create tags HTML
    const tagsHtml = post.tags && Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags.map(tag => 
          `<span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">${escapeHtml(tag.trim())}</span>`
        ).join(" ")
      : '';

    article.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-gray-900 leading-tight">
          <a href="post.php?slug=${encodeURIComponent(post.slug)}" 
             class="hover:text-blue-600 transition-colors duration-200 no-underline">
            ${escapeHtml(post.title || 'Untitled')}
          </a>
        </h2>
        
        ${post.summary ? `
          <p class="text-gray-600 text-lg leading-relaxed">
            ${escapeHtml(post.summary)}
          </p>
        ` : ''}
        
        ${tagsHtml ? `
          <div class="flex flex-wrap gap-2">
            ${tagsHtml}
          </div>
        ` : ''}
        
        <div class="flex items-center justify-between pt-4 border-t border-gray-100">
          <div class="text-sm text-gray-500">
            ${post.date ? escapeHtml(post.date) : ''}
            ${post.date && post.category ? ' • ' : ''}
            ${post.category ? escapeHtml(post.category) : ''}
          </div>
          <span class="text-sm text-gray-400">5 min read</span>
        </div>
      </div>
    `;

    container.appendChild(article);
  });
}

// Initialize tags page functionality
async function initializeTagsPage() {
  try {
    const posts = await loadPostsFromStaticIndex();
    
    // Count tags
    const tagCounts = {};
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          const trimmedTag = tag.trim();
          if (trimmedTag) {
            tagCounts[trimmedTag] = (tagCounts[trimmedTag] || 0) + 1;
          }
        });
      }
    });

    renderTagCloud(tagCounts, posts);

  } catch (error) {
    console.error('Error loading tags:', error);
    const container = document.getElementById('tag-list');
    if (container) {
      container.innerHTML = '<p class="text-red-500 text-center">Error loading tags. Please try again later.</p>';
    }
  }
}

// Render tag cloud
function renderTagCloud(tagCounts, posts) {
  const container = document.getElementById('tag-list');
  if (!container) return;
  
  container.innerHTML = '';

  // Sort tags alphabetically
  const sortedTags = Object.entries(tagCounts).sort(([a], [b]) => a.localeCompare(b));
  
  sortedTags.forEach(([tag, count]) => {
    const tagElement = document.createElement('button');
    tagElement.className = 'inline-block bg-gray-100 hover:bg-blue-100 text-gray-800 hover:text-blue-800 px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-sm hover:shadow-md';
    tagElement.textContent = `${tag} · ${count}`;
    tagElement.dataset.tag = tag;

    // Add click event to show articles with this tag
    tagElement.addEventListener('click', () => {
      showArticlesByTag(tag, posts);
    });

    container.appendChild(tagElement);
  });
}

// Show articles filtered by tag
function showArticlesByTag(tag, posts) {
  const filteredPosts = posts.filter(post => 
    post.tags && Array.isArray(post.tags) && post.tags.some(t => t.trim() === tag)
  );
  
  // Update the main content to show filtered articles
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <section class="py-16">
          <div class="mb-8">
            <button onclick="loadTagsPage()" class="text-blue-600 hover:text-blue-800 transition-colors text-sm font-medium mb-4">
              ← Back to All Tags
            </button>
            <h1 class="text-4xl font-bold text-gray-800">${escapeHtml(tag)}</h1>
            <p class="text-gray-600 mt-2">${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''} found</p>
          </div>
          <div id="articles-container" class="space-y-6"></div>
        </section>
      </div>
    `;
    
    // Render the filtered articles
    renderArticles(filteredPosts);
  }
}

// Utility function to escape HTML
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions available globally for main.js integration
window.initializeArticlesPage = initializeArticlesPage;
window.initializeTagsPage = initializeTagsPage;
window.loadPostsByTag = showArticlesByTag;