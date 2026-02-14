import { initEventListeners, handleDeleteFile } from './handlers/fileHandlers.js';
import { getSelectedFiles } from './state/fileState.js';
import { viewFile as previewFile, closePreview, downloadFile as downloadFilePreview, downloadCurrentPreviewFile } from './components/filePreview/index.js';
import { initSidebar } from './components/sidebar/sidebar.js';
import { initRouter } from './routes.js';
import { loadFiles } from './handlers/myfileHandlers.js';
import { loadStats } from './handlers/statsHandler.js';

initSidebar();

initRouter();

window.addEventListener('pageLoaded', (e) => {
    if (e.detail.pageName === 'upload') {
        initEventListeners();
    } else if (e.detail.pageName === 'myfile') {
        loadFiles();
    } else if (e.detail.pageName === 'stats') {
        loadStats();
    }
});

window.deleteFile = function(index) {
    handleDeleteFile(index);
};

window.viewFile = function(index) {
    const selectedFiles = getSelectedFiles();
    const file = selectedFiles[index];
    previewFile(file, index);
};

window.closePreview = function() {
    closePreview();
};

window.downloadFile = function(index) {
    const selectedFiles = getSelectedFiles();
    const file = selectedFiles[index];
    downloadFilePreview(file);
};

window.downloadCurrentFile = function() {
    downloadCurrentPreviewFile();
};
