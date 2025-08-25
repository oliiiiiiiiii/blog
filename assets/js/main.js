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