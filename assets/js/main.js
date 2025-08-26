// Menu toggle functionality
document.getElementById('menu-toggle').addEventListener('click', () => {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const menuItems = document.querySelectorAll('.menu-item');
  const isHidden = sidebar.classList.contains('hidden');
  
  if (isHidden) {
    sidebar.classList.remove('hidden');
    sidebar.classList.remove('menu-hidden');
    sidebar.classList.add('menu-visible');
    menuToggle.classList.add('active');
    
    setTimeout(() => {
      menuItems.forEach(item => {
        item.classList.add('animate-in');
      });
    }, 100);
    
  } else {
    menuToggle.classList.remove('active');
    
    menuItems.forEach(item => {
      item.classList.remove('animate-in');
    });
    
    setTimeout(() => {
      sidebar.classList.remove('menu-visible');
      sidebar.classList.add('menu-hidden');
      setTimeout(() => {
        sidebar.classList.add('hidden');
      }, 300);
    }, 300);
  }
});

// Function to load content dynamically
async function loadContent(page) {
  const mainContent = document.getElementById('main-content');
  
  try {
    // Show loading state
    mainContent.innerHTML = '<div class="flex justify-center items-center h-64"><div class="text-lg">Loading...</div></div>';
    
    // Special handling for different pages
    if (page === 'articles') {
      await loadArticlesPage();
      return;
    } else if (page === 'tags') {
      await loadTagsPage();
      return;
    }
    
    // Fetch the content for other pages
    const response = await fetch(`partials/${page}.html`);
    
    if (!response.ok) {
      throw new Error(`Failed to load ${page}.html`);
    }
    
    const content = await response.text();
    mainContent.innerHTML = content;
    
    // Update URL hash without triggering page reload
    window.history.pushState({page}, '', `#${page}`);
    
    // Update active navigation state
    updateActiveNavigation(page);
    
  } catch (error) {
    console.error('Error loading content:', error);
    mainContent.innerHTML = `
      <div class="text-center p-8">
        <h2 class="text-2xl font-bold text-red-600 mb-4">Error Loading Content</h2>
        <p class="text-gray-600">Could not load ${page}.html. Please make sure the file exists in the partials folder.</p>
      </div>
    `;
  }
}

// Function to update active navigation styling
function updateActiveNavigation(activePage) {
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href === `#${activePage}`) {
      link.classList.add('active');
    }
  });
}

// Handle navigation clicks
document.querySelectorAll('nav a').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    
    const href = link.getAttribute('href');
    const page = href.substring(1); // Remove the # from href
    
    // Load the corresponding content
    loadContent(page);
    
    // Close mobile menu if open
    if (window.innerWidth < 768) {
      const sidebar = document.getElementById('sidebar');
      const menuToggle = document.getElementById('menu-toggle');
      const menuItems = document.querySelectorAll('.menu-item');
      
      menuToggle.classList.remove('active');
      menuItems.forEach(item => {
        item.classList.remove('animate-in');
      });
      
      setTimeout(() => {
        sidebar.classList.remove('menu-visible');
        sidebar.classList.add('menu-hidden');
        setTimeout(() => {
          sidebar.classList.add('hidden');
        }, 300);
      }, 300);
    }
  });
});

// Handle browser back/forward buttons
window.addEventListener('popstate', (event) => {
  const page = event.state?.page || 'home';
  loadContent(page);
});

// Handle direct URL access with hash
function handleInitialLoad() {
  const hash = window.location.hash.substring(1); // Remove # from hash
  const page = hash || 'home'; // Default to home if no hash
  loadContent(page);
}

// Handle window resize - ensure proper state on desktop
window.addEventListener('resize', () => {
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const menuItems = document.querySelectorAll('.menu-item');
  
  if (window.innerWidth >= 768) {
    // Desktop - ensure menu is visible and reset animations
    sidebar.classList.remove('hidden', 'menu-hidden');
    sidebar.classList.add('menu-visible');
    menuToggle.classList.remove('active');
    menuItems.forEach(item => {
      item.classList.add('animate-in');
    });
  } else {
    // Mobile - ensure menu starts hidden
    if (!sidebar.classList.contains('menu-visible')) {
      sidebar.classList.add('hidden', 'menu-hidden');
      menuItems.forEach(item => {
        item.classList.remove('animate-in');
      });
    }
  }
});

// Initialize on page load
window.addEventListener('load', () => {
  const sidebar = document.getElementById('sidebar');
  const menuItems = document.querySelectorAll('.menu-item');
  
  if (window.innerWidth >= 768) {
    menuItems.forEach(item => {
      item.classList.add('animate-in');
    });
  } else {
    sidebar.classList.add('hidden', 'menu-hidden');
  }
  
  // Load initial content
  handleInitialLoad();
});

// Fetch posts from API
async function fetchPosts() {
  const res = await fetch('./api/posts.php');
  return await res.json();
}

// Load articles page
async function loadArticlesPage() {
  try {
    const posts = await fetchPosts();
    
    const categories = new Set();
    posts.forEach((post) => {
      if (post.category) categories.add(post.category);
    });

    const allCategories = ["All", ...Array.from(categories).sort()];
    
    // Create the articles page structure
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <section class="py-16">
          <h1 class="text-4xl font-bold mb-8 text-gray-800">Articles</h1>
          <div id="category-buttons" class="mb-6"></div>
          <div id="articles-container" class="space-y-8"></div>
        </section>
      </div>
    `;
    
    renderCategoryButtons(allCategories);
    renderPosts(posts); // Default show all
    
    // Update URL and navigation
    window.history.pushState({page: 'articles'}, '', '#articles');
    updateActiveNavigation('articles');
    
  } catch (error) {
    console.error('Error loading articles:', error);
  }
}

// Load tags page
async function loadTagsPage() {
  try {
    const posts = await fetchPosts();
    const tagCounts = {};

    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <section class="py-16">
          <h1 class="text-4xl font-bold mb-8 text-gray-800">All Tags</h1>
          <div id="tag-list" class="flex flex-wrap gap-4"></div>
        </section>
      </div>
    `;

    const tagListDiv = document.getElementById('tag-list');
    
    Object.entries(tagCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([tag, count]) => {
        const tagCard = document.createElement('div');
        tagCard.className = 'cursor-pointer px-4 py-2 bg-gray-100 hover:bg-blue-100 rounded shadow text-gray-700 font-medium transition';
        tagCard.textContent = `${tag} (${count})`;
        tagCard.dataset.tag = tag;

        tagCard.addEventListener('click', () => {
          loadPostsByTag(tag, posts);
        });

        tagListDiv.appendChild(tagCard);
      });
      
    // Update URL and navigation
    window.history.pushState({page: 'tags'}, '', '#tags');
    updateActiveNavigation('tags');
    
  } catch (error) {
    console.error('Error loading tags:', error);
  }
}

// Render category buttons
function renderCategoryButtons(categories) {
  const container = document.getElementById('category-buttons');
  if (!container) return;
  
  container.innerHTML = '';
  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.className = 'category-button px-4 py-2 rounded-full border text-sm hover:bg-blue-100 mr-2 mb-2';
    if (cat === 'All') btn.classList.add('bg-blue-500', 'text-white');
    
    btn.addEventListener('click', async () => {
      const posts = await fetchPosts();
      const buttons = document.querySelectorAll('.category-button');
      buttons.forEach((b) => b.classList.remove('bg-blue-500', 'text-white'));
      btn.classList.add('bg-blue-500', 'text-white');

      const filtered = cat === 'All' ? posts : posts.filter((p) => p.category === cat);
      renderPosts(filtered);
    });
    
    container.appendChild(btn);
  });
}

// Render posts
function renderPosts(posts) {
  const container = document.getElementById('articles-container');
  if (!container) return;
  
  container.innerHTML = '';

  if (posts.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">No articles in this category.</p>';
    return;
  }

  posts.forEach((post) => {
    const article = document.createElement('article');
    article.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';

    const tagsHtml = post.tags && Array.isArray(post.tags) 
      ? post.tags.map(tag => `<span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${tag}</span>`).join('')
      : '';

    article.innerHTML = `
      <div class="flex flex-col gap-6">
        <div class="flex-1">
          <h2 class="text-2xl font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors">
            <a href="/post.php?slug=${post.slug}" class="no-underline">${post.title || 'Untitled'}</a>
          </h2>
          <p class="text-gray-600 mb-4 leading-relaxed">${post.summary || ''}</p>
          <div class="flex flex-wrap gap-2 mb-4">
            ${tagsHtml}
          </div>
          <div class="text-sm text-gray-500">
            <span>${post.date || ''}</span>
          </div>
        </div>
      </div>
    `;

    container.appendChild(article);
  });
}

// Load posts by tag
function loadPostsByTag(tag, allPosts = null) {
  if (!allPosts) {
    fetchPosts().then(posts => {
      const filtered = posts.filter(post => post.tags && post.tags.includes(tag));
      renderArticles(filtered, `Tag: ${tag}`);
    });
  } else {
    const filtered = allPosts.filter(post => post.tags && post.tags.includes(tag));
    renderArticles(filtered, `Tag: ${tag}`);
  }
}

// Render articles with title
function renderArticles(posts, title = 'Articles') {
  const container = document.getElementById('main-content');
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <section class="py-16">
        <h1 class="text-4xl font-bold mb-8 text-gray-800">${title}</h1>
        <div class="space-y-8">
          ${posts.map(post => `
            <article class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-1">
                  <h2 class="text-2xl font-semibold mb-3 text-gray-800 hover:text-blue-600 transition-colors">
                    <a href="/post.php?slug=${post.slug}" class="no-underline">${post.title || 'Untitled'}</a>
                  </h2>
                  <p class="text-gray-600 mb-4 leading-relaxed">${post.summary || ''}</p>
                  <div class="flex flex-wrap gap-2 mb-4">
                    ${post.tags && Array.isArray(post.tags) ? post.tags.map(tag => `
                      <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${tag}</span>
                    `).join('') : ''}
                  </div>
                  <div class="text-sm text-gray-500">
                    <span>${post.date || ''}</span>
                  </div>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}