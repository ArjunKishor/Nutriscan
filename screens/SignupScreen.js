// screens/SignupScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { CountryPicker } from "react-native-country-codes-picker";

import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null); // Stores { name: {en, official}, code, flag, dial_code }

  const handleSignup = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Validation Error", "Username, Email, and Password are required.");
      return;
    }
    if (!selectedCountry) {
      Alert.alert("Validation Error", "Please select your country.");
      return;
    }
    if (!agreeToTerms) {
      Alert.alert("Terms", "You must agree to the terms and conditions.");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        country: selectedCountry.name.en || selectedCountry.name.official, // Full country name
        countryCode: selectedCountry.code, // Country code (e.g., 'PK', 'US') - for database
        createdAt: new Date(),
      });

      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      let errorMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password should be at least 6 characters.';
      }
      Alert.alert("Signup Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>
            Provide the requested information to create your account and access the platform.
            Your details are securely handled, ensuring a seamless sign-up process.
          </Text>

          <Text style={styles.inputLabel}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Write here"
            placeholderTextColor="#aaa"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

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
              placeholder="Write here (min. 6 characters)"
              placeholderTextColor="#aaa"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Country</Text>
          <TouchableOpacity
            style={styles.countrySelectorButton}
            onPress={() => setShowCountryPicker(true)}
          >
            <View style={styles.countrySelectorButtonInner}>
              {selectedCountry ? (
                <>
                  <Text style={styles.flagEmoji}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryNameText}>{selectedCountry.name.en || selectedCountry.name.official}</Text>
                </>
              ) : (
                <Text style={styles.placeholderStyle}>Select Country</Text>
              )}
            </View>
            <Entypo name="chevron-down" size={24} color="#888" style={styles.chevronIcon} />
          </TouchableOpacity>

          <CountryPicker
            show={showCountryPicker}
            pickerButtonOnPress={(item) => {
              setSelectedCountry(item);
              setShowCountryPicker(false);
            }}
            onBackdropPress={() => setShowCountryPicker(false)}
            style={{
                modal: {
                    height: Platform.OS === 'ios' ? '70%' : '80%',
                },
                // You can further style items in the list if needed:
                // countryName: { color: 'blue' }, // Example
                // dialCode: { color: 'green'}, // Example
            }}
            // This library shows flag, name, and dial code in the list by default.
            // To hide dial code in the list (if you don't want it):
            // popularCountries={['US', 'GB']} // Example
            // inputPlaceholder={'Search'} // Customize search placeholder
          />

          <View style={styles.termsContainer}>
            <Checkbox
              style={styles.checkbox}
              value={agreeToTerms}
              onValueChange={setAgreeToTerms}
              color={agreeToTerms ? '#2ECC71' : undefined}
            />
            <Text style={styles.termsText}>
              Agree to{' '}
              <Text style={styles.linkText} onPress={() => Alert.alert("Terms", "Link to your terms page")}>
                terms & conditions
              </Text>{' '}
              and{' '}
              <Text style={styles.linkText} onPress={() => Alert.alert("Privacy", "Link to your privacy policy page")}>
                privacy policy
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createAccountButton, isLoading && styles.disabledButton]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createAccountButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginPrompt}>
            <Text style={styles.loginText}>You already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center' },
  container: {
    paddingHorizontal: 30,
    paddingVertical: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 40,
    backgroundColor: '#fff',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 5, alignSelf: 'flex-start', marginTop: 10 },
  input: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    width: '100%',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    width: '100%',
  },
  passwordInput: { flex: 1, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16 },
  eyeIcon: { paddingHorizontal: 10 },
  countrySelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
    width: '100%',
    height: 50,
  },
  countrySelectorButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: Platform.OS === 'android' ? 20 : 24,
    marginRight: 10, // Increased spacing between flag and name
  },
  countryNameText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#aaa',
  },
  chevronIcon: {},
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: 5 },
  checkbox: { marginRight: 10 },
  termsText: { flex: 1, color: '#666', fontSize: 12 },
  linkText: { color: '#2ECC71', textDecorationLine: 'underline' },
  createAccountButton: {
    backgroundColor: '#2ECC71',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { opacity: 0.6 },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, paddingBottom: 20 },
  loginText: { color: '#666', fontSize: 14 },
  loginLink: { color: '#2ECC71', fontWeight: 'bold', fontSize: 14 },
});

export default SignupScreen;