import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { User } from 'firebase/auth';
import { subscribeToAuthState, signInAsGuest } from './src/services/auth';
import { Sprout } from 'lucide-react-native';

// Main App Component
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // Auto sign-in as guest if not authenticated
    const initAuth = async () => {
      try {
        await signInAsGuest();
      } catch (err) {
        console.error('Auth error:', err);
        setError('Failed to initialize. Please check your connection.');
        setLoading(false);
      }
    };

    initAuth();

    return () => unsubscribe();
  }, []);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Sprout size={48} color="#15803d" />
        <Text style={styles.loadingTitle}>Soweer</Text>
        <ActivityIndicator size="large" color="#15803d" style={styles.spinner} />
        <Text style={styles.loadingText}>Loading...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  // Main app (placeholder - will be replaced with navigation)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Sprout size={28} color="#15803d" />
        <Text style={styles.headerTitle}>Soweer</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Welcome, {user?.isAnonymous ? 'Sower' : 'Friend'}!
        </Text>
        <Text style={styles.subtitle}>
          "He who sows bountifully will also reap bountifully."
        </Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Firebase Status</Text>
          <Text style={styles.statusValue}>
            {user ? 'Connected' : 'Disconnected'}
          </Text>
          <Text style={styles.statusDetail}>
            User ID: {user?.uid?.slice(0, 8)}...
          </Text>
        </View>

        <Text style={styles.note}>
          Configure Firebase in src/config/firebase.ts to enable full functionality.
        </Text>
      </View>

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Loading Screen
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 12,
  },
  spinner: {
    marginTop: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },

  // Error Screen
  errorContainer: {
    flex: 1,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorText: {
    color: '#7f1d1d',
    textAlign: 'center',
    fontSize: 14,
  },

  // Main App
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statusLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#15803d',
    marginTop: 4,
  },
  statusDetail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 8,
    fontFamily: 'monospace',
  },
  note: {
    marginTop: 32,
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
