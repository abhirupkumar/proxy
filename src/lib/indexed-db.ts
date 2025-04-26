import { openDB } from 'idb';

export const getIndexedDB = () => {
    return openDB("partial-chat-db", 1, {
        upgrade(db) {
            if (!db.objectStoreNames.contains('messages')) {
                db.createObjectStore('messages', { keyPath: 'id' });
            }
        },
    });
};