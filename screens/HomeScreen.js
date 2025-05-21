// screens/HomeScreen.js
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, StatusBar, Platform, Alert // Removed Image import
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const THEME_COLOR = '#00C853'; // Your app's primary green

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [showAlert, setShowAlert] = useState(true);

  const handleScanPress = () => {
    console.log('Scan button pressed');
    Alert.alert("Scan", "Camera/Scan functionality to be implemented.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={Platform.OS === 'ios' ? "light-content" : "light-content"} backgroundColor={THEME_COLOR} />

      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeftPlaceholder} /> {/* Empty view for balance */}
          <Text style={styles.headerTitle}>SCAN</Text>
          <View style={styles.headerRightPlaceholder} /> {/* Empty view for balance */}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search-outline" size={22} color="#757575" style={styles.searchIcon} />
          <TextInput
            placeholder="Search Product with Name"
            placeholderTextColor="#A0A0A0"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Scanner Area */}
        <View style={styles.scannerArea}>
          <View style={[styles.scannerCorner, styles.topLeft]} />
          <View style={[styles.scannerCorner, styles.topRight]} />
          <View style={styles.scannerHorizontalLine} />
          <View style={[styles.scannerCorner, styles.bottomLeft]} />
          <View style={[styles.scannerCorner, styles.bottomRight]} />
        </View>

        {/* Health Risk Alert Card */}
        {showAlert && (
          <View style={styles.alertCard}>
            <View style={styles.alertCardHeader}>
              <Ionicons name="warning-outline" size={24} color="#D35400" style={styles.alertIcon} />
              <Text style={styles.alertTitle}>Health Risk Alerts</Text>
              <TouchableOpacity onPress={() => setShowAlert(false)} style={styles.alertCloseButton}>
                <Ionicons name="close-outline" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            <Text style={styles.alertText}>
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.
            </Text>
          </View>
        )}

        {/* Scan Button */}
        <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
          <Text style={styles.scanButtonText}>Scan</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: THEME_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // This will center the title if placeholders are equal
    paddingHorizontal: 20,
    paddingVertical: 15,
    height: 60,
  },
  headerLeftPlaceholder: { // To balance the flexbox, make its width non-zero or adjust justify
    width: 40, // Give it some width, or remove if title should be left-aligned
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center', // Ensure title is centered if placeholders have width
    flex: 1, // Allow title to take available space if placeholders have fixed width
  },
  headerRightPlaceholder: {
    width: 40, // Match left placeholder or adjust as needed
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 25,
    width: '100%',
    height: 50,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  scannerArea: {
    width: '90%',
    aspectRatio: 1.5 / 1,
    backgroundColor: '#757575',
    borderRadius: 20,
    marginBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  scannerCorner: {
    width: 40,
    height: 40,
    borderColor: '#FFF',
    borderWidth: 3,
    position: 'absolute',
  },
  topLeft: { top: 20, left: 20, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 20, right: 20, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 20, left: 20, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 20, right: 20, borderLeftWidth: 0, borderTopWidth: 0 },
  scannerHorizontalLine: { width: '60%', height: 2, backgroundColor: '#FFF', position: 'absolute' },
  alertCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 15,
    padding: 15,
    marginBottom: 25,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  alertCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  alertIcon: { marginRight: 10 },
  alertTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#333' },
  alertCloseButton: { padding: 5 },
  alertText: { fontSize: 14, color: '#555', lineHeight: 20 },
  scanButton: {
    backgroundColor: THEME_COLOR,
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 30,
    width: '80%',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  scanButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default HomeScreen;