if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/scripts/sw.jss')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
                // Force the waiting Service Worker to activate immediately
                if (registration.waiting) {
                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                }
                // Check for updates to the Service Worker
                registration.onupdatefound = () => {
                    console.log('New Service Worker found. Installing...');
                    const newWorker = registration.installing;
                    newWorker.onstatechange = () => {
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                console.log('New content is available. Please refresh.');
                                // Optional: Notify users about the update
                            } else {
                                console.log('Content is cached for offline use.');
                            }
                        }
                    };
                };
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}
