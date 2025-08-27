// assets/js/home.js - Home page functionality

// Function to load recent posts for home page
async function loadRecentPosts() {
  try {
    const response = await fetch('./api/posts.php');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const posts = await response.json();
    const recentPosts = posts.slice(0, 2); // Get the 2 most recent posts
    
    renderRecentPosts(recentPosts);
    
  } catch (error) {
    console.error('Error loading recent posts:', error);
    const container = document.getElementById('recent-posts-container');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <p class="text-red-500">Error loading recent posts. Please try again later.</p>
        </div>
      `;
    }
  }
}

// Function to render recent posts
function renderRecentPosts(posts) {
  const container = document.getElementById('recent-posts-container');
  if (!container) return;
  
  if (posts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-gray-500">No posts available yet.</p>
      </div>
    `;
    return;
  }
  
  // Clear loading state
  container.innerHTML = '';
  
  posts.forEach(post => {
    const article = document.createElement('article');
    article.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105';
    
    // Create tags HTML if available
    const tagsHtml = post.tags && Array.isArray(post.tags) && post.tags.length > 0
      ? `<div class="flex flex-wrap gap-1 mb-3">
           ${post.tags.slice(0, 3).map(tag => 
             `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">${escapeHtml(tag.trim())}</span>`
           ).join('')}
           ${post.tags.length > 3 ? '<span class="text-gray-500 text-xs">+' + (post.tags.length - 3) + ' more</span>' : ''}
         </div>`
      : '';
    
    article.innerHTML = `
      <div class="space-y-3">
        <h3 class="text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors line-clamp-2">
          ${escapeHtml(post.title || 'Untitled')}
        </h3>
        
        ${post.summary ? `
          <p class="text-gray-600 text-sm leading-relaxed line-clamp-3">
            ${escapeHtml(post.summary)}
          </p>
        ` : ''}
        
        ${tagsHtml}
        
        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
          <div class="text-sm text-gray-500">
            ${post.date ? escapeHtml(post.date) : 'No date'}
            ${post.date && post.category ? ' • ' : ''}
            ${post.category ? escapeHtml(post.category) : ''}
          </div>
          <span class="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors read-more-arrow">
            Read more →
          </span>
        </div>
      </div>
    `;
    
    // Add click event to load the full article
    article.addEventListener('click', () => {
      if (window.loadArticleInline) {
        window.loadArticleInline(post.slug);
      } else {
        // Fallback to direct post page
        window.location.href = `post.php?slug=${encodeURIComponent(post.slug)}`;
      }
    });
    
    container.appendChild(article);
  });
}

// Initialize home page functionality
function initializeHomePage() {
  // Load recent posts
  loadRecentPosts();
}

// Utility function to escape HTML (reused from articles.js pattern)
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export functions for global access
window.initializeHomePage = initializeHomePage;