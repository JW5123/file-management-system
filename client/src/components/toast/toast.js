export function showToast(options = {}) {
    const {
        message = '',
        type = 'info',
        duration = 3000,
        title = ''
    } = options;

    const statusMap = {
        success: 'success',
        error: 'error',
        warning: 'warning',
        info: 'info',
    };

    const notify = new Notify({
        status: statusMap[type] || 'info',
        title: title,
        text: message,
        effect: 'slide',
        // type: 'filled',
        speed: 200,
        showIcon: true,
        showCloseButton: true,
        autoclose: duration > 0,
        autotimeout: duration,
        position: 'right top'
    });

    return { 
        close: () => notify.close() 
    };
}

export function toastSuccess(message, duration = 2000) {
    return showToast({ message, type: 'success', duration });
}

export function toastError(message, duration = 2000) {
    return showToast({ message, type: 'error', duration });
}

export function toastWarning(message, duration = 2000) {
    return showToast({ message, type: 'warning', duration });
}

export function toastInfo(message, duration = 2000) {
    return showToast({ message, type: 'info', duration });
}
