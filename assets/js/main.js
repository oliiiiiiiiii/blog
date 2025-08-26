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
    
  }
  else {
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
    
    // Fetch the content
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

if (page === 'tags') {
  loadTags();
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
  }
  else {
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
  }
  else {
    sidebar.classList.add('hidden', 'menu-hidden');
  }
  
  // Load initial content
  handleInitialLoad();
});

async function fetchPosts() {
  const res = await fetch('./api/posts.php');
  return await res.json();
}

function loadTags() {
  fetch('/api/posts.php?tags')
    .then(res => res.json())
    .then(tagCounts => {
      const container = document.getElementById('tag-list');
      container.innerHTML = '';

      for (const [tag, count] of Object.entries(tagCounts)) {
        const tagBtn = document.createElement('a');
        tagBtn.href = `#tag-${encodeURIComponent(tag)}`;
        tagBtn.className = 'bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-200 transition';
        tagBtn.textContent = `${tag} (${count})`;
        container.appendChild(tagBtn);
      }
    });
}

// 新增函式：載入帶有指定 tag 的文章列表
function loadPostsByTag(tag) {
  fetch('/api/posts.php')
    .then(res => res.json())
    .then(posts => {
      const filtered = posts.filter(post => post.meta.tags?.includes(tag));
      renderArticles(filtered, `Tag: ${tag}`);
    });
}

// 重複利用你文章的卡片樣板來渲染文章
function renderArticles(posts, title = 'Articles') {
  const container = document.getElementById('main-content');

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
                    <a href="/post/${post.slug}" class="no-underline">${post.meta.title}</a>
                  </h2>
                  <p class="text-gray-600 mb-4 leading-relaxed">${post.meta.summary ?? ''}</p>
                  <div class="flex flex-wrap gap-2 mb-4">
                    ${post.meta.tags?.map(tag => `
                      <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">${tag}</span>
                    `).join('')}
                  </div>
                  <div class="text-sm text-gray-500">
                    <span>${post.meta.date ?? ''}</span>
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

loadPostsByTag('ubuntu') // 顯示有 ubuntu tag 的文章
renderArticles(posts, 'All Articles') // 顯示所有文章

document.addEventListener('click', e => {
  if (e.target.matches('.tag-button')) {
    const tag = e.target.dataset.tag;
    loadPostsByTag(tag);
  }
});

async function renderTagStats() {
  const posts = await loadPosts(); // 從 /api/posts.php 抓全部資料
  const tagCounts = {};

  posts.forEach(post => {
    post.meta.tags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const tagListDiv = document.getElementById('tag-list');
  tagListDiv.innerHTML = '';

  const container = document.createElement('div');
  container.className = 'flex flex-wrap gap-4';

  Object.entries(tagCounts).forEach(([tag, count]) => {
    const tagCard = document.createElement('div');
    tagCard.className =
      'cursor-pointer px-4 py-2 bg-gray-100 hover:bg-blue-100 rounded shadow text-gray-700 font-medium transition';
    tagCard.textContent = `${tag} (${count})`;
    tagCard.dataset.tag = tag;

    // 綁定點擊事件
    tagCard.addEventListener('click', () => {
      loadPostsByTag(tag); // 重新渲染文章列表
      document.querySelector('h1').textContent = tag;
    });

    container.appendChild(tagCard);
  });

  tagListDiv.appendChild(container);
}

if (window.location.pathname.includes('tags.html')) {
  renderTagStats();
}
