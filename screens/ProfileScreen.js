// screens/ProfileScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, Image, ActivityIndicator,
  ScrollView, TouchableOpacity, Modal, TextInput, FlatList, Alert,
  Platform, StatusBar,
} from 'react-native';
import { auth, db } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
  signOut,
} from 'firebase/auth';
import { Ionicons, MaterialCommunityIcons, Entypo, Feather } from '@expo/vector-icons';
import Checkbox from 'expo-checkbox';
import { CountryPicker } from "react-native-country-codes-picker";

import { AVATAR_OPTIONS, ALLERGY_OPTIONS, THEME_COLOR } from '../config/constants';

const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  return timestamp.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const [isUsernameModalVisible, setIsUsernameModalVisible] = useState(false);
  const [isAllergiesModalVisible, setIsAllergiesModalVisible] = useState(false);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);

  const [newUsername, setNewUsername] = useState('');
  const [tempSelectedAllergies, setTempSelectedAllergies] = useState([]);
  const [allergySearchTerm, setAllergySearchTerm] = useState('');
  const [tempSelectedCountry, setTempSelectedCountry] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const currentUser = auth.currentUser;

  const fetchUserData = useCallback(async () => {
    if (currentUser) {
      setIsLoading(true);
      setError(null);
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const data = userDocSnap.data();
          setUserData(data);
          setNewUsername(data.username || '');
          setTempSelectedAllergies(data.selectedAllergies || []);
        } else {
          setError("No user data found.");
        }
      } catch (err) {
        setError("Failed to fetch user data.");
      }
      setIsLoading(false);
    } else {
      setError("No user logged in.");
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdateField = async (field, value) => {
    if (!currentUser) return false;
    setIsUpdating(true);
    const userDocRef = doc(db, "users", currentUser.uid);
    try {
      await updateDoc(userDocRef, { [field]: value });
      setUserData(prev => ({ ...prev, [field]: value }));
      Alert.alert("Success", `${field.charAt(0).toUpperCase() + field.slice(1)} updated.`);
      return true;
    } catch (err) {
      Alert.alert("Error", `Failed to update ${field}.`);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateUsername = async () => {
    if (!newUsername.trim()) {
      Alert.alert("Validation Error", "Username cannot be empty.");
      return;
    }
    const success = await handleUpdateField('username', newUsername.trim());
    if (success) setIsUsernameModalVisible(false);
  };

  const handleUpdateAvatar = async (avatarId) => {
    const selectedAvatarData = AVATAR_OPTIONS.find(avatar => avatar.id === avatarId);
    if (!selectedAvatarData || !currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { avatarId, avatarUrl: selectedAvatarData.uri });
      setUserData(prev => ({ ...prev, avatarId, avatarUrl: selectedAvatarData.uri }));
      Alert.alert("Success", "Profile picture updated.");
      setIsAvatarModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Failed to update profile picture.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateAllergies = async () => {
    const success = await handleUpdateField('selectedAllergies', tempSelectedAllergies);
    if (success) setIsAllergiesModalVisible(false);
  };

  const handleUpdateCountry = async () => {
    if (!tempSelectedCountry || !currentUser) return;
    setIsUpdating(true);
    try {
      const countryName = tempSelectedCountry.name.en || tempSelectedCountry.name.official;
      await updateDoc(doc(db, "users", currentUser.uid), { country: countryName, countryCode: tempSelectedCountry.code });
      setUserData(prev => ({ ...prev, country: countryName, countryCode: tempSelectedCountry.code }));
      Alert.alert("Success", "Country updated.");
      setIsCountryModalVisible(false);
      setTempSelectedCountry(null);
    } catch (err) {
      Alert.alert("Error", "Failed to update country.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Validation Error", "All password fields are required.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters long.");
      return;
    }
    setIsUpdating(true);
    try {
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await firebaseUpdatePassword(currentUser, newPassword);
      Alert.alert("Success", "Password updated successfully.");
      setIsPasswordModalVisible(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
    } catch (error) {
      let errorMessage = "Failed to update password.";
      if (error.code === 'auth/wrong-password') errorMessage = "Incorrect current password.";
      else if (error.code === 'auth/too-many-requests') errorMessage = "Too many attempts. Please try again later.";
      else if (error.code === 'auth/user-token-expired') errorMessage = "Session expired. Please login again.";
      Alert.alert("Password Change Error", errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleAllergyInModal = (allergy) => {
    setTempSelectedAllergies(prev =>
      prev.includes(allergy) ? prev.filter(a => a !== allergy) : [...prev, allergy]
    );
  };

  const filteredAllergiesForModal = ALLERGY_OPTIONS.filter(allergy =>
    allergy.toLowerCase().includes(allergySearchTerm.toLowerCase())
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout", style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
            // Navigation to login is typically handled by onAuthStateChanged listener in App.js
          } catch (error) {
            Alert.alert("Logout Error", "Could not sign out. Please try again.");
          }
        }
      }
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={styles.statusText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#d9534f" />
        <Text style={[styles.statusText, styles.errorText]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!userData) { // Should be covered by error state, but as a fallback
    return (
      <SafeAreaView style={[styles.safeArea, styles.centered]}>
        <Text style={styles.statusText}>No profile data available.</Text>
         <TouchableOpacity style={styles.retryButton} onPress={fetchUserData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"} backgroundColor={THEME_COLOR} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)} style={styles.avatarTouchable}>
            {userData.avatarUrl ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person-circle-outline" size={80} color="#ccc" />
              </View>
            )}
            <View style={styles.editAvatarIconContainer}><Feather name="edit-2" size={16} color="#fff" /></View>
          </TouchableOpacity>
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{userData.username || 'N/A'}</Text>
            <TouchableOpacity onPress={() => { setNewUsername(userData.username || ''); setIsUsernameModalVisible(true); }}>
              <Feather name="edit-2" size={20} color="#666" style={styles.inlineEditIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.email}>{userData.email || 'N/A'}</Text>
        </View>

        {/* Account Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <ProfileDetailRow icon="calendar-outline" label="Member Since" value={formatDate(userData.createdAt)} />
          <ProfileDetailRow
            icon="earth-outline"
            label="Country"
            value={`${userData.country || 'N/A'} (${userData.countryCode || 'N/A'})`}
            onEditPress={() => setIsCountryModalVisible(true)}
          />
          <TouchableOpacity style={styles.changePasswordButton} onPress={() => setIsPasswordModalVisible(true)}>
            <MaterialCommunityIcons name="lock-reset" size={20} color={THEME_COLOR} style={styles.detailIcon} />
            <Text style={styles.changePasswordText}>Change Password</Text>
            <Entypo name="chevron-right" size={22} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Allergies Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Allergies & Dietary Restrictions</Text>
            <TouchableOpacity onPress={() => { setTempSelectedAllergies(userData.selectedAllergies || []); setIsAllergiesModalVisible(true); }}>
              <Feather name="edit-2" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          {userData.selectedAllergies && userData.selectedAllergies.length > 0 ? (
            <View style={styles.chipsContainer}>
              {userData.selectedAllergies.map((allergy) => (
                <View key={allergy} style={styles.chip}><Text style={styles.chipText}>{allergy}</Text></View>
              ))}
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#999" />
              <Text style={styles.noDataText}>No allergies specified.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color="#fff" style={styles.logoutIcon} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* --- Modals --- */}
      <Modal visible={isUsernameModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsUsernameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleText}>Edit Username</Text>
            <TextInput style={styles.modalInput} value={newUsername} onChangeText={setNewUsername} placeholder="Enter new username" autoCapitalize="none" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsUsernameModalVisible(false)} disabled={isUpdating}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleUpdateUsername} disabled={isUpdating}>
                {isUpdating ? <ActivityIndicator color="#fff" size="small"/> : <Text style={[styles.modalButtonText, styles.modalButtonSaveText]}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={isAvatarModalVisible} animationType="slide" transparent={false} onRequestClose={() => setIsAvatarModalVisible(false)}>
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitleTextLarge}>Select Profile Picture</Text>
            <TouchableOpacity onPress={() => setIsAvatarModalVisible(false)}><Ionicons name="close" size={30} color="#333" /></TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.avatarOptionsContainer}>
              {AVATAR_OPTIONS.map(avatar => (
                <TouchableOpacity key={avatar.id} style={styles.avatarOptionItem} onPress={() => handleUpdateAvatar(avatar.id)} disabled={isUpdating}>
                  <Image source={{ uri: avatar.uri }} style={styles.avatarOptionImage} />
                   {isUpdating && userData?.avatarId === avatar.id && <ActivityIndicator style={styles.avatarLoadingIndicator} />}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={isAllergiesModalVisible} animationType="slide" transparent={false} onRequestClose={() => { setIsAllergiesModalVisible(false); setAllergySearchTerm(''); }}>
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitleTextLarge}>Allergies & Restrictions</Text>
            <TouchableOpacity onPress={() => { setIsAllergiesModalVisible(false); setAllergySearchTerm(''); }}>
              <Text style={styles.modalDoneText}>Done</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.modalSearch} placeholder="Search allergies..." value={allergySearchTerm} onChangeText={setAllergySearchTerm} placeholderTextColor="#999" />
          <FlatList
            data={filteredAllergiesForModal}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.modalListItem} onPress={() => toggleAllergyInModal(item)}>
                <Checkbox style={styles.modalItemCheckbox} value={tempSelectedAllergies.includes(item)} onValueChange={() => toggleAllergyInModal(item)} color={tempSelectedAllergies.includes(item) ? THEME_COLOR : undefined} />
                <Text style={styles.modalListItemText}>{item}</Text>
              </TouchableOpacity>
            )}
            ItemSeparatorComponent={() => <View style={styles.modalListSeparator} />}
          />
          <TouchableOpacity style={[styles.modalPrimaryButton, styles.modalBottomButton]} onPress={handleUpdateAllergies} disabled={isUpdating}>
            {isUpdating ? <ActivityIndicator color="#fff"/> : <Text style={styles.modalPrimaryButtonText}>Save Allergies</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <Modal visible={isCountryModalVisible} animationType="slide" transparent={false} onRequestClose={() => setIsCountryModalVisible(false)}>
        <SafeAreaView style={styles.fullModalContainer}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitleTextLarge}>Select Country</Text>
            <TouchableOpacity onPress={() => setIsCountryModalVisible(false)}><Ionicons name="close" size={30} color="#333" /></TouchableOpacity>
          </View>
          <CountryPicker
            show={true}
            onBackdropPress={() => setIsCountryModalVisible(false)}
            pickerButtonOnPress={(item) => setTempSelectedCountry(item)}
            style={{ modal: { height: '85%' }, textInput: styles.modalSearch }}
            ListHeaderComponent={tempSelectedCountry && (
                <View style={styles.selectedCountryPreview} >
                    <Text style={styles.selectedCountryText}>Selected: {tempSelectedCountry.flag} {tempSelectedCountry.name.en || tempSelectedCountry.name.official}</Text>
                </View>
            )}
          />
           <TouchableOpacity style={[styles.modalPrimaryButton, styles.modalBottomButton]} onPress={handleUpdateCountry} disabled={isUpdating || !tempSelectedCountry}>
            {isUpdating ? <ActivityIndicator color="#fff"/> : <Text style={styles.modalPrimaryButtonText}>Save Country</Text>}
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      <Modal visible={isPasswordModalVisible} animationType="fade" transparent={true} onRequestClose={() => setIsPasswordModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitleText}>Change Password</Text>
            <TextInput style={styles.modalInput} value={currentPassword} onChangeText={setCurrentPassword} placeholder="Current Password" secureTextEntry placeholderTextColor="#999" />
            <TextInput style={styles.modalInput} value={newPassword} onChangeText={setNewPassword} placeholder="New Password (min. 6 characters)" secureTextEntry placeholderTextColor="#999" />
            <TextInput style={styles.modalInput} value={confirmNewPassword} onChangeText={setConfirmNewPassword} placeholder="Confirm New Password" secureTextEntry placeholderTextColor="#999" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setIsPasswordModalVisible(false)} disabled={isUpdating}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonSave]} onPress={handleChangePassword} disabled={isUpdating}>
                 {isUpdating ? <ActivityIndicator color="#fff" size="small"/> : <Text style={[styles.modalButtonText, styles.modalButtonSaveText]}>Update</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const ProfileDetailRow = ({ icon, label, value, onEditPress }) => (
  <View style={styles.detailRow}>
    <Ionicons name={icon} size={22} color="#555" style={styles.detailIcon} />
    <View style={styles.detailTextContainer}>
      <Text style={styles.detailLabelText}>{label}</Text>
      <Text style={styles.detailValueText}>{value}</Text>
    </View>
    {onEditPress && (
      <TouchableOpacity onPress={onEditPress} style={styles.rowEditIcon}>
        <Feather name="edit-2" size={20} color="#666" />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F0F2F5' },
  scrollContainer: { paddingBottom: 30 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  statusText: { marginTop: 10, fontSize: 16, color: '#555', textAlign: 'center'},
  errorText: { color: '#d9534f', marginBottom: 15 },
  retryButton: { backgroundColor: THEME_COLOR, paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20},
  retryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerContainer: {
    backgroundColor: '#fff', paddingVertical: 24, alignItems: 'center',
    borderBottomLeftRadius: 20, borderBottomRightRadius: 20, marginBottom: 20, elevation: 3,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  avatarTouchable: { position: 'relative', marginBottom: 12 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: THEME_COLOR },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e0e0e0' },
  editAvatarIconContainer: {
    position: 'absolute', bottom: 5, right: 5, backgroundColor: THEME_COLOR,
    borderRadius: 15, padding: 6, borderWidth: 2, borderColor: '#fff',
  },
  usernameContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  username: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  inlineEditIcon: { marginLeft: 8, padding: 5 },
  email: { fontSize: 15, color: '#777' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16, marginBottom: 20,
    paddingVertical: 10, paddingHorizontal: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingTop: 6 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#333' },
  noDataContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  noDataText: { fontSize: 14, color: '#888', fontStyle: 'italic', marginLeft: 8 },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F0F2F5',
  },
  detailIcon: { marginRight: 16, color: '#555' },
  detailTextContainer: { flex: 1 },
  detailLabelText: { fontSize: 13, color: '#777', marginBottom: 2 },
  detailValueText: { fontSize: 15, color: '#333', fontWeight: '500' },
  rowEditIcon: { padding: 8 },
  changePasswordButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  changePasswordText: { flex: 1, fontSize: 15, color: THEME_COLOR, fontWeight: '500' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, paddingBottom: 6 },
  chip: { backgroundColor: '#E8F5E9', borderRadius: 16, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  chipText: { fontSize: 13, color: '#1B5E20', fontWeight: '500' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#d9534f',
    paddingVertical: 14, borderRadius: 25, marginHorizontal: 16, marginTop: 10, marginBottom: 20, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  logoutIcon: { marginRight: 10 },
  logoutButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalContent: {
    backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%', maxHeight: '90%', elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4,
  },
  modalTitleText: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  modalInput: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 15, marginBottom: 15,
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  modalButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10, minWidth: 90, alignItems: 'center', justifyContent: 'center' },
  modalButtonCancel: { backgroundColor: '#f0f0f0' },
  modalButtonSave: { backgroundColor: THEME_COLOR },
  modalButtonText: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  modalButtonSaveText: { color: '#fff' },
  fullModalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 15, borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  modalTitleTextLarge: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  modalDoneText: { fontSize: 16, color: THEME_COLOR, fontWeight: 'bold', padding: 5 },
  modalSearch: {
    height: 48, borderColor: '#ddd', borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 15, marginHorizontal: 16, marginVertical: 16, fontSize: 15,
  },
  modalListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20 },
  modalItemCheckbox: { marginRight: 16 },
  modalListItemText: { fontSize: 16, color: '#333', flex: 1 },
  modalListSeparator: { height: 1, backgroundColor: '#f0f0f0', marginLeft: 20 + 16 + (Platform.OS === 'ios' ? 0 : 8) },
  modalPrimaryButton: {
    backgroundColor: THEME_COLOR, paddingVertical: 14, borderRadius: 25,
    alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, minHeight: 48,
  },
  modalBottomButton: { marginVertical: 20 },
  modalPrimaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  avatarOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 8 },
  avatarOptionItem: { alignItems: 'center', margin: 8, padding: 8, borderWidth: 2, borderColor: 'transparent', borderRadius: 10, position: 'relative' },
  avatarOptionImage: { width: 90, height: 90, borderRadius: 45, marginBottom: 5 },
  avatarLoadingIndicator: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -12 }, { translateY: -12 }] },
  selectedCountryPreview: { paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', backgroundColor: '#f9f9f9', borderBottomWidth: 1, borderColor: '#eee' },
  selectedCountryText: { fontSize: 15, color: '#333' },
});

export default ProfileScreen;