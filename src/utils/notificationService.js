// src/utils/notificationService.js
// In-app notification system using Firebase Realtime Database
// Stores notifications in RTDB and uses onValue listeners for real-time updates

import { ref, push, set, onValue, update, get } from 'firebase/database';
import { database } from '../firebase/firebaseConfig';

/**
 * Create a notification for all registered users
 * Called when a new product is added or auction starts
 */
export const createNotificationForAllUsers = async (notification) => {
    try {
        const usersRef = ref(database, 'users');
        const usersSnapshot = await get(usersRef);

        if (usersSnapshot.exists()) {
            const users = usersSnapshot.val();
            const promises = Object.keys(users).map((userId) => {
                const notifRef = push(ref(database, `userNotifications/${userId}`));
                return set(notifRef, {
                    ...notification,
                    read: false,
                    timestamp: Date.now(),
                });
            });
            await Promise.all(promises);
        }
    } catch (error) {
        console.error('Error creating notifications:', error);
    }
};

/**
 * Create a notification for a specific seller
 */
export const createSellerNotification = async (sellerEmail, notification) => {
    try {
        const notifRef = push(ref(database, 'notifications'));
        await set(notifRef, {
            ...notification,
            sellerEmail,
            read: false,
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('Error creating seller notification:', error);
    }
};

/**
 * Create notification when a new product/auction is added
 */
export const notifyNewProduct = async (productName, sellerEmail) => {
    await createNotificationForAllUsers({
        type: 'new_product',
        title: 'New Auction Listed!',
        message: `A new product "${productName}" has been listed for auction.`,
        sellerEmail,
    });
};

/**
 * Create notification when auction bidding starts
 */
export const notifyAuctionStart = async (productName, auctionId) => {
    await createNotificationForAllUsers({
        type: 'auction_start',
        title: 'Auction Starting Now!',
        message: `Bidding for "${productName}" has started. Place your bid now!`,
        auctionId,
    });
};

/**
 * Create notification when a bid is placed (for seller)
 */
export const notifyNewBid = async (sellerEmail, productName, bidAmount, bidderEmail) => {
    await createSellerNotification(sellerEmail, {
        type: 'new_bid',
        title: 'New Bid Received!',
        message: `New bid of ₹${bidAmount} placed on "${productName}" by ${bidderEmail}.`,
    });
};

/**
 * Listen for user notifications in real-time
 * Returns an unsubscribe function
 */
export const listenForUserNotifications = (userId, callback) => {
    const notifRef = ref(database, `userNotifications/${userId}`);
    return onValue(notifRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            const notifications = Object.entries(data)
                .map(([id, notif]) => ({ id, ...notif }))
                .sort((a, b) => b.timestamp - a.timestamp);
            callback(notifications);
        } else {
            callback([]);
        }
    });
};

/**
 * Mark a notification as read
 */
export const markNotificationRead = async (userId, notificationId) => {
    try {
        const notifRef = ref(database, `userNotifications/${userId}/${notificationId}`);
        await update(notifRef, { read: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsRead = async (userId) => {
    try {
        const notifRef = ref(database, `userNotifications/${userId}`);
        const snapshot = await get(notifRef);
        if (snapshot.exists()) {
            const updates = {};
            Object.keys(snapshot.val()).forEach((key) => {
                updates[`${key}/read`] = true;
            });
            await update(notifRef, updates);
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
};

/**
 * Show browser notification if permission is granted
 */
export const showBrowserNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
        });
    }
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
};
