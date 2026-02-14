const routes = {
    'upload': '/pages/upload.html',
    'myfile': '/pages/myfile.html',
    'stats': '/pages/stats.html',
    'setting': '/pages/setting.html'
};

function createLoadErrorPage(...lines) {
    const fragment = document.createDocumentFragment();
    lines.forEach(({ tag = 'p', text }) => {
        const el = document.createElement(tag);
        el.textContent = text;
        fragment.appendChild(el);
    });
    return fragment;
}

export async function loadPage(pageName) {
    const mainContent = document.getElementById('main-content');
    const pageUrl = routes[pageName];
    
    if (!pageUrl) {
        console.error(`找不到頁面: ${pageName}`);
        clearElement(mainContent);
        mainContent.appendChild(
            createLoadErrorPage(
                { tag: 'h1', text: '404 - 頁面不存在' },
                { text: '請確認網址是否正確' }
            )
        );
        return;
    }
    
    try {
        const response = await fetch(pageUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        
        mainContent.innerHTML = html;
        
        window.location.hash = pageName;

        updateSidebarActive(pageName);
        
        window.dispatchEvent(new CustomEvent('pageLoaded', { detail: { pageName } }));
    } catch (error) {
        console.error('載入頁面時發生錯誤:', error);
        clearElement(mainContent);
        mainContent.appendChild(
            createLoadErrorPage(
                { tag: 'h1', text: '載入頁面失敗' },
                { text: '請稍後再試' }
            )
        );
    }
}

function clearElement(element) {
    element.replaceChildren();
}

function updateSidebarActive(pageName) {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

export function initRouter() {
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const pageName = link.getAttribute('data-page');
            if (pageName) {
                loadPage(pageName);
            }
        });
    });
    
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1);
        if (hash && routes[hash]) {
            loadPage(hash);
        }
    });
    
    const hash = window.location.hash.slice(1);
    const initialPage = (hash && routes[hash]) ? hash : 'myfile';
    loadPage(initialPage);
}
