function irLogin(type) {
    window.location.href = `login.html?type=${type}`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});
