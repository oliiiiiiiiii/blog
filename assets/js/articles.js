// assets/js/articles.js

document.addEventListener("DOMContentLoaded", async () => {
  // Only run if we're on the articles page
  if (!document.getElementById('category-buttons') || !document.getElementById('articles-container')) {
    return;
  }

  try {
    const res = await fetch("/api/posts.php");
    const posts = await res.json();

    const categories = new Set();
    posts.forEach((post) => {
      if (post.category) categories.add(post.category);
    });

    // Add "All" option and sort categories
    const allCategories = ["All", ...Array.from(categories).sort()];

    renderCategoryButtons(allCategories, posts);
    renderPosts(posts); // Default show all posts

  } catch (error) {
    console.error('Error loading articles:', error);
    const container = document.getElementById('articles-container');
    if (container) {
      container.innerHTML = '<p class="text-red-500 text-center">Error loading articles. Please try again later.</p>';
    }
  }
});

function renderCategoryButtons(categories, posts) {
  const container = document.getElementById("category-buttons");
  if (!container) return;
  
  container.innerHTML = "";
  
  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.className = "category-button px-4 py-2 rounded-full border text-sm hover:bg-blue-100 mr-2 mb-2";
    
    if (cat === "All") {
      btn.classList.add("bg-blue-500", "text-white");
    }
    
    btn.addEventListener("click", () => {
      // Remove active state from all buttons
      const buttons = document.querySelectorAll(".category-button");
      buttons.forEach((b) => b.classList.remove("bg-blue-500", "text-white"));
      
      // Add active state to clicked button
      btn.classList.add("bg-blue-500", "text-white");

      // Filter and render posts
      const filtered = cat === "All" ? posts : posts.filter((p) => p.category === cat);
      renderPosts(filtered);
    });
    
    container.appendChild(btn);
  });
}

function renderPosts(posts) {
  const container = document.getElementById("articles-container");
  if (!container) return;
  
  container.innerHTML = "";

  if (posts.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">No articles in this category.</p>';
    return;
  }

  posts.forEach((post) => {
    const article = document.createElement("article");
    article.className = "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow";

    const tagsHtml = post.tags && Array.isArray(post.tags) 
      ? post.tags.map(tag => 
          `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${escapeHtml(tag)}</span>`
        ).join("")
      : '';

    article.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="flex-1">
          <h2 class="text-2xl font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors">
            <a href="/post.php?slug=${encodeURIComponent(post.slug)}" class="no-underline">${escapeHtml(post.title || 'Untitled')}</a>
          </h2>
          <p class="text-gray-600 mb-4 leading-relaxed">${escapeHtml(post.summary || '')}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${tagsHtml}
          </div>
          <div class="text-sm text-gray-500">
            <span>${escapeHtml(post.date || '')}</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(article);
  });
}

// Utility function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Function to load posts by tag (for tag page integration)
async function loadPostsByTag(tag) {
  try {
    const res = await fetch('/api/posts.php');
    const posts = await res.json();
    const filtered = posts.filter(post => post.tags && post.tags.includes(tag));
    
    const container = document.getElementById('main-content');
    if (container) {
      renderArticlesPage(filtered, `Tag: ${tag}`);
    }
  } catch (error) {
    console.error('Error loading posts by tag:', error);
  }
}

// Function to render articles page with custom title
function renderArticlesPage(posts, title = 'Articles') {
  const container = document.getElementById('main-content');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <section class="py-16">
        <h1 class="text-4xl font-bold mb-8 text-gray-800">${escapeHtml(title)}</h1>
        <div class="space-y-8" id="articles-list">
          ${posts.map(post => `
            <article class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-1">
                  <h2 class="text-2xl font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors">
                    <a href="/post.php?slug=${encodeURIComponent(post.slug)}" class="no-underline">${escapeHtml(post.title || 'Untitled')}</a>
                  </h2>
                  <p class="text-gray-600 mb-4 leading-relaxed">${escapeHtml(post.summary || '')}</p>
                  <div class="flex flex-wrap gap-2 mb-4">
                    ${post.tags && Array.isArray(post.tags) ? post.tags.map(tag => `
                      <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${escapeHtml(tag)}</span>
                    `).join('') : ''}
                  </div>
                  <div class="text-sm text-gray-500">
                    <span>${escapeHtml(post.date || '')}</span>
                  </div>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
        
        ${posts.length === 0 ? '<p class="text-gray-500 text-center">No articles found.</p>' : ''}
        
        <div class="mt-8 text-center">
          <a href="#home" class="text-blue-600 hover:text-blue-800 transition-colors">← Back to Home</a>
        </div>
      </section>
    </div>
  `;
}

// Make functions available globally for integration with main.js
window.loadPostsByTag = loadPostsByTag;
window.renderArticlesPage = renderArticlesPage;