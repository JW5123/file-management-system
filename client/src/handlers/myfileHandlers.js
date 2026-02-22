import { viewFile } from '../components/filePreview/index.js';
import { showLoading, renderFileCards, renderSearchDropdown, hideSearchDropdown} from '../render/myfileRender.js';
import { API_FILES_URL, API_BASE_URL } from '../config/config.js';
import { showDeleteConfirmDialog, showRenameDialog } from '../components/dialog/dialog.js';
import { toastSuccess, toastError } from '../components/toast/toast.js';
import { getFileCategory, formatDate } from '../utils/fileUtils.js';

let allFiles = [];
let searchFilterInitialized = false;

function showSearchDropdown(keyword) {
    if (!keyword) {
        renderSearchDropdown(null, formatDate, handleDropdownSelect);
        return;
    }

    const matched = allFiles
        .filter(f => f.file_name.toLowerCase().includes(keyword))
        .slice(0, 10);

    renderSearchDropdown(matched, formatDate, handleDropdownSelect);
}

function handleDropdownSelect(file) {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');

    if (searchInput) searchInput.value = '';
    if (searchClear) searchClear.style.display = 'none';
    hideSearchDropdown();

    handleFileCardClick(file);
}

// 篩選檔案（類型 + 日期範圍）
function filterFiles({ type = '', startDate = '', endDate = '' } = {}) {
    let filtered = allFiles;

    if (type) {
        filtered = filtered.filter(f => getFileCategory(f.file_type) === type);
    }
    if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter(f => new Date(f.created_at) >= start);
    }
    if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter(f => new Date(f.created_at) <= end);
    }

    renderFileCards(filtered);
}

// 初始化搜尋和篩選事件
function initSearchFilter() {
    if (searchFilterInitialized) return;
    searchFilterInitialized = true;

    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const filterType = document.getElementById('filter-type');
    const dateStart = document.getElementById('filter-date-start');
    const dateEnd = document.getElementById('filter-date-end');
    const resetBtn = document.getElementById('filter-reset');

    function getCurrentFilterParams() {
        return {
            type: filterType?.value ?? '',
            startDate: dateStart?.value ?? '',
            endDate: dateEnd?.value ?? '',
        };
    }

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const val = searchInput.value.trim().toLowerCase();
            if (searchClear) searchClear.style.display = searchInput.value ? 'flex' : 'none';
            showSearchDropdown(val);
        });

        searchInput.addEventListener('focus', () => {
            const val = searchInput.value.trim().toLowerCase();
            if (val) showSearchDropdown(val);
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) hideSearchDropdown();
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            searchClear.style.display = 'none';
            hideSearchDropdown();
        });
    }

    if (filterType) filterType.addEventListener('change', () => filterFiles(getCurrentFilterParams()));
    if (dateStart) dateStart.addEventListener('change', () => filterFiles(getCurrentFilterParams()));
    if (dateEnd) dateEnd.addEventListener('change', () => filterFiles(getCurrentFilterParams()));

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (searchClear) searchClear.style.display = 'none';
            if (filterType) filterType.value = '';
            if (dateStart) dateStart.value = '';
            if (dateEnd) dateEnd.value = '';
            hideSearchDropdown();
            filterFiles();
        });
    }
}

async function fetchFiles() {
    try {
        const response = await fetch(API_FILES_URL);
        const result = await response.json();
        
        if (result.success) {
            return result.data;
        } else {
            console.error('獲取檔案列表失敗:', result.message);
            return [];
        }
    } catch (error) {
        console.error('網路錯誤:', error);
        return [];
    }
}

// 刪除檔案（支援單個或多個）
export async function handleDeleteFile(files) {
    try {
        const fileList = Array.isArray(files) ? files : [files];
        
        console.log('準備刪除檔案:', fileList);
        
        const confirmed = await showDeleteConfirmDialog(fileList);
        if (!confirmed) {
            return false;
        }

        let successCount = 0;
        let failedFiles = [];
        
        for (const file of fileList) {
            try {
                const url = `${API_FILES_URL}/file/${encodeURIComponent(file.file_name)}`;
                console.log('刪除 URL:', url);
                
                const response = await fetch(url, {
                    method: 'DELETE'
                });

                console.log('回應狀態:', response.status);
                const result = await response.json();
                console.log('回應內容:', result);

                if (result.success) {
                    successCount++;
                } else {
                    failedFiles.push(`${file.file_name}: ${result.message}`);
                }
            } catch (error) {
                console.error('刪除錯誤:', error);
                failedFiles.push(`${file.file_name}: ${error.message}`);
            }
        }
        
        // 使用 Toast 顯示結果
        if (failedFiles.length === 0) {
            toastSuccess(`成功刪除 ${successCount} 個檔案`);
        } else {
            toastError(`刪除失敗：${failedFiles.length} 個檔案`);
        }
        
        // 重新載入檔案列表
        await loadFiles();
        return successCount > 0;
    } catch (error) {
        console.error('刪除錯誤:', error);
        toastError('刪除失敗：' + error.message);
        return false;
    }
}

// 重新命名檔案
export async function handleRenameFile(file) {
    try {
        const newFileName = await showRenameDialog(file);
        
        if (!newFileName) {
            return false; // 使用者取消或沒有變更
        }
        
        const url = `${API_FILES_URL}/rename`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                oldFileName: file.file_name,
                newFileName 
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            toastSuccess('重新命名成功');
            await loadFiles();
            return true;
        } else {
            toastError('重新命名失敗：' + result.message);
            return false;
        }
    } catch (error) {
        console.error('重新命名錯誤:', error);
        toastError('重新命名失敗：' + error.message);
        return false;
    }
}

// 處理檔案卡片點擊
export async function handleFileCardClick(file) {
    try {
        const url = `${API_FILES_URL}/file/${encodeURIComponent(file.file_name)}`;
    
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('無法載入檔案');
        }

        const blob = await response.blob();
        
        // 創建 File 物件，並附加伺服器 URL 用於下載
        const fileObject = new File([blob], file.file_name, {
            type: blob.type || 'application/octet-stream'
        });
        
        fileObject.serverUrl = `${API_BASE_URL}/uploads/${file.file_name}`;
        
        viewFile(fileObject);
        
    } catch (error) {
        console.error('預覽錯誤:', error);
        alert('無法預覽檔案：' + error.message);
    }
}

export async function loadFiles() {
    showLoading();
    searchFilterInitialized = false;
    const files = await fetchFiles();
    allFiles = files;
    renderFileCards(files);
    initSearchFilter();
}
