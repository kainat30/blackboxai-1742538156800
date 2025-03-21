const CACHE_NAME = 'expense-tracker-v1';
const STATIC_ASSETS = [
    '/',
    '/css/style.css',
    '/js/main.js',
    '/js/utils.js',
    '/js/forms.js',
    '/js/auth.js',
    '/js/charts.js',
    '/js/notifications.js',
    '/js/export-import.js',
    '/favicon.svg',
    '/manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                return self.clients.claim();
            })
    );
});

// Fetch Event Handler
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    // Handle API requests
    if (event.request.url.includes('/api/')) {
        return handleApiRequest(event);
    }

    // Handle static assets and navigation requests
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response as it can only be consumed once
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return fallback for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline.html');
                        }
                    });
            })
    );
});

// Handle API Requests
function handleApiRequest(event) {
    return fetch(event.request)
        .then((response) => {
            if (!response || response.status !== 200) {
                return response;
            }

            const responseToCache = response.clone();

            // Cache successful API responses for offline use
            caches.open(CACHE_NAME)
                .then((cache) => {
                    cache.put(event.request, responseToCache);
                });

            return response;
        })
        .catch(() => {
            // Return cached API response if available
            return caches.match(event.request);
        });
}

// Background Sync for Offline Actions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

// Sync Offline Transactions
async function syncTransactions() {
    try {
        const offlineData = await getOfflineData('offlineTransactions');
        
        for (const transaction of offlineData) {
            await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });
        }

        // Clear synced transactions
        await clearOfflineData('offlineTransactions');
    } catch (error) {
        console.error('Error syncing transactions:', error);
    }
}

// Push Notification Handler
self.addEventListener('push', (event) => {
    const options = {
        body: event.data.text(),
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Details'
            },
            {
                action: 'close',
                title: 'Close'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('Expense Tracker', options)
    );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/dashboard')
        );
    }
});

// Helper Functions
async function getOfflineData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ExpenseTrackerOffline', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const data = [];

            store.openCursor().onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    data.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(data);
                }
            };
        };
    });
}

async function clearOfflineData(storeName) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ExpenseTrackerOffline', 1);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            
            store.clear().onsuccess = () => resolve();
        };
    });
}