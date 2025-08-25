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
    
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 768) { // Only on mobile
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
    });