import { formatFileSize, formatDate, getFileTypeLabel } from '../../utils/fileUtils.js';

function createBaseDialog({ type, title, bodyHTML, footerHTML, onClose, onMounted }) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = `dialog dialog-${type}`;
    dialog.innerHTML = `
        <div class="dialog-header">
            <h3 class="dialog-title">${title}</h3>
            <button class="dialog-close" title="關閉">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="dialog-body">${bodyHTML}</div>
        <div class="dialog-footer">${footerHTML}</div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        overlay.classList.add('show');
        dialog.classList.add('show');
        onMounted?.();
    });

    // 關閉：移除動畫後呼叫 callback
    const close = (result) => {
        overlay.classList.remove('show');
        dialog.classList.remove('show');
        document.removeEventListener('keydown', handleKeydown);
        setTimeout(() => {
            overlay.remove();
            onClose(result);
        }, 200);
    };

    dialog.querySelector('.dialog-close').addEventListener('click', () => close(null));

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close(null);
    });

    const handleKeydown = (e) => {
        if (e.key === 'Escape') close(null);
    };
    document.addEventListener('keydown', handleKeydown);

    return { dialog, close };
}

export function showConfirmDialog(options = {}) {
    const {
        title = '確認',
        message = '確定要執行此操作嗎？',
        confirmText = '確定',
        cancelText = '取消',
        type = 'info'
    } = options;

    return new Promise((resolve) => {
        const { dialog, close } = createBaseDialog({
            type,
            title,
            bodyHTML: `<div class="dialog-message">${message}</div>`,
            footerHTML: `
                <button class="dialog-btn dialog-btn-cancel">${cancelText}</button>
                <button class="dialog-btn dialog-btn-confirm dialog-btn-${type}">${confirmText}</button>
            `,
            onClose: (result) => resolve(result ?? false),
        });

        dialog.querySelector('.dialog-btn-cancel').addEventListener('click', () => close(false));
        dialog.querySelector('.dialog-btn-confirm').addEventListener('click', () => close(true));
    });
}

export function showDeleteConfirmDialog(files) {
    const fileList = Array.isArray(files) ? files : [files];
    const isSingle = fileList.length === 1;

    const message = isSingle
        ? `
            <p>確定要刪除以下檔案嗎？</p>
            <div class="dialog-file-item">
                <i class="fas fa-file"></i>
                <span>${fileList[0].file_name}</span>
            </div>
        `
        : `
            <p>確定要刪除以下 <strong>${fileList.length}</strong> 個檔案嗎？</p>
            <div class="dialog-file-list">
                ${fileList.map(f => `
                    <div class="dialog-file-item">
                        <i class="fas fa-file"></i>
                        <span>${f.file_name}</span>
                    </div>
                `).join('')}
            </div>
        `;

    return showConfirmDialog({
        title: '刪除確認',
        message,
        confirmText: '刪除',
        cancelText: '取消',
        type: 'danger'
    });
}

export function showRenameDialog(file) {
    const lastDotIndex = file.file_name.lastIndexOf('.');
    const baseName = lastDotIndex > 0 ? file.file_name.substring(0, lastDotIndex) : file.file_name;
    const extension = lastDotIndex > 0 ? file.file_name.substring(lastDotIndex) : '';

    return new Promise((resolve) => {
        const { dialog, close } = createBaseDialog({
            type: 'info',
            title: '重新命名',
            bodyHTML: `
                <div class="dialog-input-group">
                    <div class="dialog-input-wrapper">
                        <input type="text" id="rename-input" class="dialog-input" value="${baseName}">
                        <span class="dialog-input-extension">${extension}</span>
                    </div>
                </div>
            `,
            footerHTML: `
                <button class="dialog-btn dialog-btn-cancel">取消</button>
                <button class="dialog-btn dialog-btn-confirm dialog-btn-info">確定</button>
            `,
            onClose: (result) => resolve(result ?? null),
            onMounted: () => {
                const input = dialog.querySelector('#rename-input');
                input.focus();
                input.select();
            },
        });

        const input = dialog.querySelector('#rename-input');

        const submit = () => {
            const newBaseName = input.value.trim();
            if (!newBaseName) {
                input.classList.add('error');
                return;
            }
            const newFileName = newBaseName + extension;
            close(newFileName === file.file_name ? null : newFileName);
        };

        dialog.querySelector('.dialog-btn-cancel').addEventListener('click', () => close(null));
        dialog.querySelector('.dialog-btn-confirm').addEventListener('click', submit);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') submit();
        });

        input.addEventListener('input', () => {
            input.classList.remove('error');
        });
    });
}

export function showFileInfoDialog(file) {
    const infoRows = [
        { label: '檔案名稱', value: file.file_name },
        { label: '檔案類型', value: getFileTypeLabel(file.file_name) },
        { label: '檔案大小', value: formatFileSize(file.file_size) },
        { label: '建立時間', value: formatDate(file.created_at, { fallback: '無資料', showSeconds: true }) },
        { label: '修改時間', value: formatDate(file.modified_at, { fallback: '無資料', showSeconds: true }) },
        { label: '最後開啟', value: formatDate(file.last_opened_at, { fallback: '無資料', showSeconds: true }) },
    ];

    const { dialog, close } = createBaseDialog({
        type: 'info',
        title: '檔案資訊',
        bodyHTML: `
            <div class="dialog-file-info">
                ${infoRows.map(({ label, value }) => `
                    <div class="file-info-row">
                        <span class="file-info-label">${label}</span>
                        <span class="file-info-value">${value}</span>
                    </div>
                `).join('')}
            </div>
        `,
        footerHTML: `<button class="dialog-btn dialog-btn-confirm dialog-btn-info">關閉</button>`,
        onClose: () => {},
    });

    dialog.querySelector('.dialog-btn-confirm').addEventListener('click', () => close(null));
}

export function showUploadResultDialog(successFiles, failedFiles) {
    const totalCount = successFiles.length + failedFiles.length;
    const allSuccess = failedFiles.length === 0;
    const allFailed = successFiles.length === 0;
    const type = allFailed ? 'danger' : allSuccess ? 'success' : 'warning';
    const iconClass = allFailed ? 'fa-times-circle' : allSuccess ? 'fa-check-circle' : 'fa-exclamation-circle';
    const statusText = allFailed ? '上傳失敗' : allSuccess ? '上傳成功' : '部分上傳成功';

    const successListHtml = successFiles.length > 0 ? `
        <div class="upload-result-section">
            <div class="upload-result-label success-label">
                <i class="fas fa-check"></i> 成功 (${successFiles.length})
            </div>
            <div class="dialog-file-list">
                ${successFiles.map(() => `
                    <div class="dialog-file-item success-item">
                        <i class="fas fa-file"></i>
                        <span></span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    const failedListHtml = failedFiles.length > 0 ? `
        <div class="upload-result-section">
            <div class="upload-result-label failed-label">
                <i class="fas fa-times"></i> 失敗 (${failedFiles.length})
            </div>
            <div class="dialog-file-list">
                ${failedFiles.map(() => `
                    <div class="dialog-file-item failed-item">
                        <i class="fas fa-file"></i>
                        <span></span>
                        <span class="failed-reason"></span>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    return new Promise((resolve) => {
        const { dialog, close } = createBaseDialog({
            type,
            title: '上傳結果',
            bodyHTML: `
                <div class="upload-result-summary">
                    <i class="fas ${iconClass} upload-result-icon ${type}-icon"></i>
                    <div class="upload-result-text"></div>
                    <div class="upload-result-count">${successFiles.length} / ${totalCount} 個檔案上傳成功</div>
                </div>
                ${successListHtml}
                ${failedListHtml}
            `,
            footerHTML: `<button class="dialog-btn dialog-btn-confirm dialog-btn-${type}">確定</button>`,
            onClose: () => resolve(),
        });

        dialog.querySelector('.upload-result-text').textContent = statusText;

        if (successFiles.length > 0) {
            const successItems = dialog.querySelectorAll('.success-item span');
            successFiles.forEach((name, i) => {
                successItems[i].textContent = name;
            });
        }

        if (failedFiles.length > 0) {
            const failedItems = dialog.querySelectorAll('.failed-item');
            failedFiles.forEach((f, i) => {
                failedItems[i].querySelector('span').textContent = f.name;
                failedItems[i].querySelector('.failed-reason').textContent = f.reason;
            });
        }

        dialog.querySelector('.dialog-btn-confirm').addEventListener('click', () => close(null));
    });
}