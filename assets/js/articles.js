// Global variables to store posts and navigation context
let allPosts = [];
let navigationContext = {
  source: null, // 'articles', 'tags', 'tag-filter'
  category: null, // for articles page category filter
  tag: null, // for tag-specific navigation
  posts: null // filtered posts to return to
};

// Initialize articles page functionality
async function initializeArticlesPage(initialCategory = 'All') {
  try {
    const res = await fetch("./api/posts.php");
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    allPosts = await res.json();

    // Set navigation context
    navigationContext = {
      source: 'articles',
      category: initialCategory,
      tag: null,
      posts: allPosts
    };

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

    renderCategoryButtons(categoryList, initialCategory);
    
    // Show articles based on initial category
    const initialPosts = initialCategory === "All" 
      ? allPosts 
      : allPosts.filter((post) => post.category === initialCategory);
    
    navigationContext.posts = initialPosts;
    renderArticles(initialPosts);

  } catch (error) {
    console.error('Error loading articles:', error);
    const container = document.getElementById('articles-container');
    if (container) {
      container.innerHTML = `<p class="text-red-500 text-center">Error loading articles: ${error.message}</p>`;
    }
  }
}

// Render category filter buttons
function renderCategoryButtons(categories, activeCategory = 'All') {
  const container = document.getElementById("category-buttons");
  if (!container) return;
  
  container.innerHTML = "";
  
  categories.forEach((category) => {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.dataset.category = category;
    btn.className = "category-button px-6 py-2 rounded-full text-sm font-medium mr-4 mb-2 transition-all duration-200";
    
    // Style for active/inactive states
    if (category === activeCategory) {
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
      
      // Update navigation context
      navigationContext.category = category;
      navigationContext.posts = filteredPosts;
      
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
    article.className = "bg-white rounded-xl shadow-sm p-8 hover:shadow-lg transition-all duration-300 border border-gray-100 cursor-pointer";

    // Create tags HTML
    const tagsHtml = post.tags && Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags.map(tag => 
          `<span class="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">${escapeHtml(tag.trim())}</span>`
        ).join(" ")
      : '';

    article.innerHTML = `
      <div class="space-y-4">
        <h2 class="text-2xl font-bold text-gray-900 leading-tight hover:text-[rgb(60,46,46)] transition-colors duration-200">
          ${escapeHtml(post.title || 'Untitled')}
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
        </div>
      </div>
    `;

    // Add click event to load article inline
    article.addEventListener('click', () => {
      loadArticleInline(post.slug);
    });

    container.appendChild(article);
  });
}

// Load article content inline
async function loadArticleInline(slug) {
  try {
    // Show loading state
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<div class="flex justify-center items-center h-64"><div class="text-lg">Loading article...</div></div>';
    
    // Fetch article content from backend
    const response = await fetch(`./api/get-post.php?slug=${encodeURIComponent(slug)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load article: ${response.status}`);
    }
    
    const postData = await response.json();
    
    // Render article inline
    renderArticleInline(postData);
    
    // Update URL without page reload
    window.history.pushState({page: 'article', slug: slug}, '', `#article/${slug}`);
    updateActiveNavigation('article');
  } catch (error) {
    console.error('Error loading article:', error);
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="text-center p-8">
        <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Article</h2>
        <p class="text-gray-600">Could not load the article. Please try again.</p>
        <button onclick="loadArticlesPage()" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
          Back to Articles
        </button>
      </div>
    `;
  }
}

// Render article content inline
function renderArticleInline(postData) {
  const mainContent = document.getElementById('main-content');
  
  // Create tags HTML
  const tagsHtml = postData.meta.tags && Array.isArray(postData.meta.tags) && postData.meta.tags.length > 0
    ? postData.meta.tags.map(tag => 
        `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">${escapeHtml(tag.trim())}</span>`
      ).join(" ")
    : '';
  
  // Determine back button text and action based on navigation context
  let backButtonText = 'Back to Articles';
  let backButtonAction = 'returnToPreviousPage()';
  
  if (navigationContext.source === 'tags') {
    backButtonText = 'Back to All Tags';
  } else if (navigationContext.source === 'tag-filter' && navigationContext.tag) {
    backButtonText = `Back to ${navigationContext.tag}`;
  } else if (navigationContext.source === 'articles' && navigationContext.category) {
    backButtonText = `Back to Articles`;
  } else if (navigationContext.source === 'home') {
    backButtonText = 'Back to Home';
  }
  
  mainContent.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <!-- Navigation -->
      <div class="mb-6">
        <button onclick="${backButtonAction}" class="back-button transition-colors text-sm mb-4 flex items-center">
          <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          ${backButtonText}
        </button>
      </div>

      <!-- Article -->
      <article class="bg-white rounded-lg shadow-sm p-8">
        <!-- Article header -->
        <header class="mb-8 border-b pb-6">
          <h1 class="text-4xl font-bold mb-4 text-gray-900">${escapeHtml(postData.meta.title || 'Untitled')}</h1>
          
          <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            ${postData.meta.date ? `
              <div class="flex items-center">
                <span class="font-medium">Published:</span>
                <span class="ml-1">${escapeHtml(postData.meta.date)}</span>
              </div>
            ` : ''}
            
            ${postData.meta.category ? `
              <div class="flex items-center">
                <span class="font-medium">Category:</span>
                <span class="ml-1 bg-gray-100 px-2 py-1 rounded">${escapeHtml(postData.meta.category)}</span>
              </div>
            ` : ''}
          </div>
          
          ${tagsHtml ? `
            <div class="flex flex-wrap gap-2 mb-4">
              ${tagsHtml}
            </div>
          ` : ''}
          
          ${postData.meta.summary ? `
            <div class="mt-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
              <p class="text-gray-700">${escapeHtml(postData.meta.summary)}</p>
            </div>
          ` : ''}
        </header>
        
        <!-- Article body -->
        <div class="prose prose-lg max-w-none article-content">
          ${postData.content}
        </div>
      </article>
    </div>
    <button id="back-to-top" aria-label="Back to top" class="hidden fixed bottom-6 right-6 bg-gray-700 text-white p-3 rounded-full shadow-lg hover:bg-gray-800 transition-colors">
      <i class="fa-regular fa-circle-up text-2xl"></i>
    </button>
  `;

  // Add copy buttons to code blocks
  addCopyButtons();

  // Back to top button functionality
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      mainContent.scrollTo({ top: 0, behavior: 'smooth' });
    });

    mainContent.addEventListener('scroll', () => {
      if (mainContent.scrollTop > 300) {
        backToTopBtn.classList.remove('hidden');
      } else {
        backToTopBtn.classList.add('hidden');
      }
    });
  }

  // Scroll to top
  mainContent.scrollTo(0, 0);
}

// Add copy buttons to code blocks
function addCopyButtons() {
  const codeBlocks = document.querySelectorAll('pre');
  codeBlocks.forEach((block) => {
    const button = document.createElement('button');
    button.className = 'copy-button absolute top-2 right-2 bg-gray-700 text-white px-2 py-1 text-xs rounded opacity-70 hover:opacity-100 transition-opacity';
    button.textContent = 'Copy';
    button.onclick = () => copyCode(block, button);
    
    // Make sure the pre element has relative positioning
    block.style.position = 'relative';
    block.appendChild(button);
  });
}

// Copy code to clipboard
async function copyCode(block, button) {
  const code = block.querySelector('code');
  const text = code ? code.textContent : block.textContent;
  
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copied!';
    button.classList.add('bg-green-600');
    
    setTimeout(() => {
      button.textContent = 'Copy';
      button.classList.remove('bg-green-600');
    }, 2000);
  } catch (err) {
    console.error('Failed to copy code:', err);
    button.textContent = 'Failed';
    setTimeout(() => {
      button.textContent = 'Copy';
    }, 2000);
  }
}

// Initialize tags page functionality
async function initializeTagsPage() {
  try {
    const res = await fetch("./api/posts.php");
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const posts = await res.json();
    
    // Set navigation context
    navigationContext = {
      source: 'tags',
      category: null,
      tag: null,
      posts: posts
    };
    
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
      container.innerHTML = `<p class="text-red-500 text-center">Error loading tags: ${error.message}</p>`;
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
  
  // Update navigation context
  navigationContext = {
    source: 'tag-filter',
    category: null,
    tag: tag,
    posts: filteredPosts
  };
  
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

// Function to return to previous page based on context
function returnToPreviousPage() {
  const mainContent = document.getElementById('main-content');
  
  if (navigationContext.source === 'articles') {
    // Return to articles page with the same category filter
    loadArticlesPageWithCategory(navigationContext.category);
  } else if (navigationContext.source === 'tag-filter') {
    // Return to tag-filtered articles
    showArticlesByTag(navigationContext.tag, allPosts);
  } else if (navigationContext.source === 'tags') {
    // Return to tags page
    loadTagsPage();
  } else if (navigationContext.source === 'home') {
    // Return to home page
    loadContent('home');
  } else {
    // Fallback to articles page
    loadArticlesPage();
  }
}

// Load articles page with specific category selected
async function loadArticlesPageWithCategory(category = 'All') {
  try {
    // Load the articles HTML template
    const response = await fetch('partials/articles.html');
    const html = await response.text();
    
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = html;
    
    // Initialize articles functionality with the specific category
    if (window.initializeArticlesPage) {
      await window.initializeArticlesPage(category);
    }
    
    // Update URL and navigation
    window.history.pushState({page: 'articles'}, '', '#articles');
    if (window.updateActiveNavigation) {
      window.updateActiveNavigation('articles');
    }
    
  } catch (error) {
    console.error('Error loading articles:', error);
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="text-center p-8">
        <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Articles</h2>
        <p class="text-gray-600">Could not load articles. Please try again later.</p>
      </div>
    `;
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
window.loadArticleInline = loadArticleInline;
window.returnToPreviousPage = returnToPreviousPage;
window.loadArticlesPageWithCategory = loadArticlesPageWithCategory;