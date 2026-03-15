// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '../firebase/firebaseConfig';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userRole, setUserRole] = useState(null); // 'user', 'seller', or 'admin'
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setLoading(true); // Ensure loading is true while we fetch the role
                setUser(firebaseUser);
                // Determine user role by checking each collection
                try {
                    // Check admins collection FIRST (Highest privilege)
                    const adminRef = ref(database, `admins/${firebaseUser.uid}`);
                    const adminSnap = await get(adminRef);
                    if (adminSnap.exists()) {
                        const data = adminSnap.val();
                        setUserRole('admin');
                        setUserProfile(data);
                        setLoading(false);
                        return;
                    }

                    // Check sellers collection
                    const sellerRef = ref(database, `sellers/${firebaseUser.uid}`);
                    const sellerSnap = await get(sellerRef);
                    if (sellerSnap.exists()) {
                        const data = sellerSnap.val();
                        setUserRole(data.role || 'seller');
                        setUserProfile(data);
                        setLoading(false);
                        return;
                    }

                    // Check users collection
                    const userRef = ref(database, `users/${firebaseUser.uid}`);
                    const userSnap = await get(userRef);
                    if (userSnap.exists()) {
                        const data = userSnap.val();
                        setUserRole(data.role || 'user');
                        setUserProfile(data);
                        setLoading(false);
                        return;
                    }

                    // User exists in Firebase Auth but not in any DB collection
                    // Default to 'user' role so they can still use the app
                    setUserRole('user');
                    setUserProfile({ email: firebaseUser.email, name: firebaseUser.displayName || '' });
                } catch (error) {
                    console.error('Error fetching user role:', error);
                    // Default to 'user' on error as well
                    setUserRole('user');
                    setUserProfile(null);
                }
            } else {
                setUser(null);
                setUserRole(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserRole(null);
            setUserProfile(null);
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const value = {
        user,
        userRole,
        userProfile,
        loading,
        logout,
        isAuthenticated: !!user,
        isUser: userRole === 'user',
        isSeller: userRole === 'seller',
        isAdmin: userRole === 'admin',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
