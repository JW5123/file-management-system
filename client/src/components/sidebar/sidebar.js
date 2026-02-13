export function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const overlay = document.getElementById('sidebar-overlay');

    function toggleSidebar(forceCollapse = null) {
        if (forceCollapse === true) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
            sidebarToggle.classList.add('collapsed');
            overlay.classList.remove('active');
        } else if (forceCollapse === false) {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
            sidebarToggle.classList.remove('collapsed');
        } else {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
            sidebarToggle.classList.toggle('collapsed');
            // 小螢幕時切換遮罩
            if (isSmallScreen()) {
                overlay.classList.toggle('active', !sidebar.classList.contains('collapsed'));
            }
        }
    }

    sidebarToggle.addEventListener('click', () => {
        toggleSidebar();
    });

    overlay.addEventListener('click', () => {
        toggleSidebar(true);
    });

    
    function isSmallScreen() {
        return window.innerWidth <= 1000;
    }

    function handleResize() {
        if (isSmallScreen()) {
            toggleSidebar(true);
        } else {
            overlay.classList.remove('active');
            toggleSidebar(false);
        }
    }

    window.addEventListener('resize', handleResize);
}