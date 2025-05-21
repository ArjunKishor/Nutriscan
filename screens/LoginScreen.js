// screens/LoginScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase imports
import { auth } from '../config/firebase'; // Import from your config
import { signInWithEmailAndPassword } from 'firebase/auth';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Email and Password are required.");
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigation will be handled by App.js onAuthStateChanged
      Alert.alert("Success", "Logged in successfully!");
    } catch (error) {
      console.error("Login Error:", error);
      let errorMessage = "An error occurred during login. Please try again.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      Alert.alert("Login Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Please enter your credential</Text>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="your@mail.com"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Write here"
            placeholderTextColor="#aaa"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
            <MaterialCommunityIcons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color="#888" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => Alert.alert("Forgot Password", "Forgot password functionality to be implemented.")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.loginButton, isLoading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupPrompt}>
          <Text style={styles.signupText}>You don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Signup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Keep all your existing styles and add:
const styles = StyleSheet.create({
  // ... (your existing styles from previous LoginScreen.js)
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, paddingHorizontal: 30, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 40 },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 5, alignSelf: 'flex-start' },
  input: { backgroundColor: '#F5F5F5', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 8, fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E0E0E0', width: '100%' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 10, width: '100%' },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  eyeIcon: { padding: 10 },
  forgotPassword: { fontSize: 14, color: '#2ECC71', textAlign: 'right', marginBottom: 40 },
  loginButton: { backgroundColor: '#2ECC71', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginTop: 20, marginBottom: 30, width: '100%', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 2 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#A5D6A7' },
  signupPrompt: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  signupText: { fontSize: 14, color: '#666' },
  signupLink: { fontSize: 14, color: '#2ECC71', fontWeight: 'bold' },
});

export default LoginScreen;