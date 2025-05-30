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
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons, Entypo, Ionicons } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { CountryPicker } from "react-native-country-codes-picker";

import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

// --- IMPORT CONSTANTS ---
import { AVATAR_OPTIONS, ALLERGY_OPTIONS, THEME_COLOR } from '../config/constants'; // Adjust path if necessary

// --- REMOVE LOCAL DEFINITIONS of ALLERGY_OPTIONS and AVATAR_OPTIONS ---
// export const ALLERGY_OPTIONS = [ ... ]; // DELETED
// const AVATAR_OPTIONS = [ ... ]; // DELETED


const SignupScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);

  const [selectedAvatar, setSelectedAvatar] = useState(null); // This will store the ID

  const [selectedAllergies, setSelectedAllergies] = useState([]);
  const [isAllergyModalVisible, setIsAllergyModalVisible] = useState(false);
  const [allergySearchTerm, setAllergySearchTerm] = useState('');


  const handleSignup = async () => {
    if (!selectedAvatar) {
      Alert.alert("Validation Error", "Please select a profile picture.");
      return;
    }
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

      // AVATAR_OPTIONS is now imported
      const selectedAvatarData = AVATAR_OPTIONS.find(avatar => avatar.id === selectedAvatar);
      const avatarUrlToStore = selectedAvatarData ? selectedAvatarData.uri : null;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        username: username,
        email: email,
        avatarId: selectedAvatar,
        avatarUrl: avatarUrlToStore,
        selectedAllergies: selectedAllergies,
        country: selectedCountry.name.en || selectedCountry.name.official,
        countryCode: selectedCountry.code,
        createdAt: new Date(),
        // title: null, // You can add a 'title' field here if desired, e.g., "New Member"
      });

      Alert.alert("Success", "Account created successfully!");
      setUsername('');
      setEmail('');
      setPassword('');
      setSelectedAvatar(null);
      setSelectedAllergies([]);
      setSelectedCountry(null);
      setAgreeToTerms(false);
      setShowPassword(false);
      // navigation.navigate('Login'); // Or redirect to a part of the app
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

  const toggleAllergyInModal = (allergy) => {
    setSelectedAllergies(prev =>
      prev.includes(allergy)
        ? prev.filter(a => a !== allergy)
        : [...prev, allergy]
    );
  };

  const removeAllergyChip = (allergyToRemove) => {
    setSelectedAllergies(prev => prev.filter(allergy => allergy !== allergyToRemove));
  };

  // ALLERGY_OPTIONS is now imported
  const filteredAllergiesForModal = ALLERGY_OPTIONS.filter(allergy =>
    allergy.toLowerCase().includes(allergySearchTerm.toLowerCase())
  );

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

          <Text style={styles.inputLabel}>Choose your Profile Picture</Text>
          <View style={styles.avatarContainer}>
            {/* AVATAR_OPTIONS is now imported */}
            {AVATAR_OPTIONS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarTouchable,
                  selectedAvatar === avatar.id && styles.avatarSelected,
                ]}
                onPress={() => setSelectedAvatar(avatar.id)}
                activeOpacity={0.7}
              >
                <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
              </TouchableOpacity>
            ))}
          </View>

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

          <Text style={styles.inputLabel}>Allergies (optional)</Text>
          <View style={styles.allergiesOuterContainer}>
            <TouchableOpacity
              style={styles.allergiesChipInputArea}
              onPress={() => setIsAllergyModalVisible(true)}
              activeOpacity={0.7}
            >
              {selectedAllergies.length === 0 ? (
                <Text style={styles.allergiesPlaceholder}>Tap to add allergies</Text>
              ) : (
                <View style={styles.chipsWrapper}>
                  {selectedAllergies.map(allergy => (
                    <View key={allergy} style={styles.chip}>
                      <Text style={styles.chipText}>{allergy}</Text>
                      <TouchableOpacity
                        onPress={() => removeAllergyChip(allergy)}
                        style={styles.chipRemoveIconTouchable}
                      >
                        <Ionicons name="close-circle" size={18} color="#555" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
            {selectedAllergies.length > 0 && (
                 <TouchableOpacity onPress={() => setIsAllergyModalVisible(true)} style={styles.editAllergiesButton}>
                    <MaterialCommunityIcons name="pencil-outline" size={22} color="#666" />
                 </TouchableOpacity>
            )}
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
            }}
          />

          <View style={styles.termsContainer}>
            <Checkbox
              style={styles.checkbox}
              value={agreeToTerms}
              onValueChange={setAgreeToTerms}
              color={agreeToTerms ? THEME_COLOR : undefined} // Use imported THEME_COLOR
            />
            <Text style={styles.termsText}>
              Agree to{' '}
              <Text style={[styles.linkText, {color: THEME_COLOR}]} onPress={() => Alert.alert("Terms", "Link to your terms page")}>
                terms & conditions
              </Text>{' '}
              and{' '}
              <Text style={[styles.linkText, {color: THEME_COLOR}]} onPress={() => Alert.alert("Privacy", "Link to your privacy policy page")}>
                privacy policy
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.createAccountButton, isLoading && styles.disabledButton, {backgroundColor: THEME_COLOR}]}
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
              <Text style={[styles.loginLink, {color: THEME_COLOR}]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isAllergyModalVisible}
        onRequestClose={() => {
          setIsAllergyModalVisible(false);
          setAllergySearchTerm('');
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Allergies</Text>
            <TouchableOpacity onPress={() => {
              setIsAllergyModalVisible(false);
              setAllergySearchTerm('');
            }}>
              <Text style={[styles.doneButton, {color: THEME_COLOR}]}>Done</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalSearchInput}
            placeholder="Search allergies..."
            value={allergySearchTerm}
            onChangeText={setAllergySearchTerm}
            placeholderTextColor="#999"
          />

          <FlatList
            data={filteredAllergiesForModal} // Uses imported ALLERGY_OPTIONS
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.modalAllergyItem}
                onPress={() => toggleAllergyInModal(item)}
              >
                <Checkbox
                  style={styles.modalCheckbox}
                  value={selectedAllergies.includes(item)}
                  onValueChange={() => toggleAllergyInModal(item)}
                  color={selectedAllergies.includes(item) ? THEME_COLOR : undefined} // Use imported THEME_COLOR
                />
                <Text style={styles.modalAllergyText}>{item}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
          />
        </SafeAreaView>
      </Modal>
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
  inputLabel: { fontSize: 14, color: '#333', marginBottom: 8, alignSelf: 'flex-start', marginTop: 15 },
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
  avatarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
  },
  avatarTouchable: {
    padding: 3,
    borderWidth: 4,
    borderColor: 'transparent',
    borderRadius: 50, // Ensure this is large enough for the image + border + padding
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    borderColor: THEME_COLOR, // Use imported THEME_COLOR
  },
  avatarImage: {
    width: 80,
    height: 80,
  },
  allergiesOuterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  allergiesChipInputArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 50,
  },
  allergiesPlaceholder: {
    fontSize: 16,
    color: '#aaa',
  },
  chipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9e9e9',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  chipText: {
    fontSize: 14,
    color: '#333',
    marginRight: 6,
  },
  chipRemoveIconTouchable: {},
  editAllergiesButton: {
    marginLeft: 10,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    width: 40,
  },
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
    marginRight: 10,
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
  termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 25, marginTop: 10 },
  checkbox: { marginRight: 10 },
  termsText: { flex: 1, color: '#666', fontSize: 12 },
  linkText: { textDecorationLine: 'underline' }, // color will be set dynamically using THEME_COLOR
  createAccountButton: {
    // backgroundColor will be set dynamically using THEME_COLOR
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  createAccountButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  disabledButton: { opacity: 0.6 },
  loginPrompt: { flexDirection: 'row', justifyContent: 'center', marginTop: 30, paddingBottom: 20 },
  loginText: { color: '#666', fontSize: 14 },
  loginLink: { fontWeight: 'bold', fontSize: 14 }, // color will be set dynamically using THEME_COLOR
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 15 : StatusBar.currentHeight + 10, // Added StatusBar.currentHeight
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  doneButton: { // color will be set dynamically
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSearchInput: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginHorizontal: 20,
    marginVertical: 15,
    fontSize: 16,
  },
  modalAllergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  modalAllergyText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
    flex: 1,
  },
  modalCheckbox: {},
  modalSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 20 + 15 + 8,
  },
});

export default SignupScreen;