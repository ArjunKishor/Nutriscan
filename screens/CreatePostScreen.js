// screens/CreatePostScreen.js
import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Image, Alert, ActivityIndicator,
  Platform, StatusBar, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
// For image picking and uploading (add these later)
// import * as ImagePicker from 'expo-image-picker';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { THEME_COLOR, PLACEHOLDER_AVATAR } from '../config/constants'; // Ensure constants are imported

const CreatePostScreen = ({ navigation }) => {
  const [postText, setPostText] = useState('');
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // For profile loading
  // const [imageUri, setImageUri] = useState(null);

  const textInputRef = useRef(null); // For autofocus

  useEffect(() => {
    const fetchCurrentUserProfile = async () => {
      setIsLoadingProfile(true);
      if (auth.currentUser) {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setCurrentUserProfile(docSnap.data());
            // Autofocus TextInput after profile is loaded
            setTimeout(() => textInputRef.current?.focus(), 100);
          } else {
            Alert.alert("Profile Error", "User profile not found. Please try again or complete your profile.", [
              { text: "OK", onPress: () => navigation.goBack() }
            ]);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          Alert.alert("Error", "Could not load your profile data. Please check your connection and try again.", [
             { text: "OK", onPress: () => navigation.goBack() }
          ]);
        }
      } else {
        Alert.alert("Authentication Error", "You must be logged in to create a post.", [
            { text: "OK", onPress: () => navigation.goBack() } // Or navigate to login
        ]);
      }
      setIsLoadingProfile(false);
    };
    fetchCurrentUserProfile();
  }, [navigation]);

  useEffect(() => {
    // Configure header right button for posting
    // This depends on postText and isPosting, so it needs to be an effect
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handlePostSubmit}
          disabled={isPosting || !canSubmitPost()}
          style={styles.headerButtonContainer}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 20 }} />
          ) : (
            <Text style={[styles.headerPostButton, !canSubmitPost() && styles.headerPostButtonDisabled]}>
              Post
            </Text>
          )}
        </TouchableOpacity>
      ),
      headerTitle: "Create Post",
      headerTintColor: '#fff',
      headerStyle: {
        backgroundColor: THEME_COLOR,
        elevation: Platform.OS === 'android' ? 4 : 0, // Standard elevation for Android
        shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0, // Subtle shadow for iOS
      },
      headerTitleStyle: { color: '#fff', fontWeight: 'bold' },
      headerLeft: () => ( // Custom back button if needed, or to handle dismiss keyboard
          <TouchableOpacity onPress={() => { Keyboard.dismiss(); navigation.goBack(); }} style={{ marginLeft: 15 }}>
              <Ionicons name="close-outline" size={30} color="#fff" />
          </TouchableOpacity>
      )
    });
  }, [navigation, postText, isPosting, currentUserProfile /*, imageUri*/]);

  const canSubmitPost = () => {
    // return (postText.trim().length > 0 || imageUri !== null) && currentUserProfile !== null;
    return postText.trim().length > 0 && currentUserProfile !== null;
  };

  // const handlePickImage = async () => { /* ... your image picker logic ... */ };

  const handlePostSubmit = async () => {
    if (!canSubmitPost()) {
      Alert.alert("Cannot Post", "Please write something to post and ensure your profile is loaded.");
      return;
    }
    Keyboard.dismiss(); // Dismiss keyboard before posting
    setIsPosting(true);
    let postImageUrl = null;

    // --- Image Upload Logic (Uncomment and implement when ready) ---
    // if (imageUri) { /* ... */ }

    try {
      await addDoc(collection(db, "posts"), {
        userId: auth.currentUser.uid,
        username: currentUserProfile.username || "Anonymous",
        userAvatarUrl: currentUserProfile.avatarUrl || PLACEHOLDER_AVATAR,
        // userTitle: currentUserProfile.title || null, // Example: if you store a user title
        text: postText.trim(),
        imageUrl: postImageUrl,
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        likedBy: [], // Initialize likedBy as empty array
      });
      // Alert.alert("Success", "Your post has been published!"); // Optional: Can be too intrusive
      navigation.goBack();
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Post Failed", "Could not publish your post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={styles.loadingText}>Loading your details...</Text>
      </SafeAreaView>
    );
  }

  if (!currentUserProfile && !isLoadingProfile) { // Should be caught by alerts, but good fallback
     return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <Ionicons name="warning-outline" size={40} color="orange" />
        <Text style={styles.loadingText}>Could not load profile. Please go back.</Text>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.goBackButton}>
            <Text style={styles.goBackButtonText}>Go Back</Text>
         </TouchableOpacity>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: currentUserProfile?.avatarUrl || PLACEHOLDER_AVATAR }}
            style={styles.userAvatar}
          />
          <Text style={styles.postAsUsername}>{currentUserProfile?.username || 'Anonymous'}</Text>
        </View>

        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          multiline
          placeholder={`What's on your mind, ${currentUserProfile?.username || 'User'}?`}
          placeholderTextColor="#AAB8C2" // Twitter-like placeholder color
          value={postText}
          onChangeText={setPostText}
          maxLength={500}
          scrollEnabled={false} // Let the ScrollView handle scrolling
        />
        <Text style={styles.charCount}>{postText.length}/500</Text>


        {/* {imageUri && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={28} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
          </View>
        )} */}

        {/* Add Image Button could be placed at the bottom or in a toolbar */}
      </ScrollView>
      {/* 
      <View style={styles.bottomToolbar}>
         <TouchableOpacity style={styles.toolbarButton} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={26} color={THEME_COLOR} />
        </TouchableOpacity>
        // Add other toolbar items like location, tags, etc.
      </View>
      */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  safeAreaLoading: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#555',
  },
  goBackButton: {
      marginTop: 20,
      backgroundColor: THEME_COLOR,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
  },
  goBackButtonText: {
      color: '#fff',
      fontWeight: 'bold',
  },
  container: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
    flexGrow: 1, // Ensures content can grow and scroll
  },
  headerButtonContainer: { // To allow ActivityIndicator to fit well
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPostButton: {
    color: '#fff',
    fontSize: 17, // Slightly larger
    fontWeight: '600', // Semi-bold
  },
  headerPostButtonDisabled: {
    color: 'rgba(255,255,255,0.6)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: '#E9ECEF',
  },
  postAsUsername: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  textInput: {
    fontSize: Platform.OS === 'ios' ? 17 : 16,
    textAlignVertical: 'top',
    lineHeight: Platform.OS === 'ios' ? 24 : 22, // Better line height
    paddingTop: 0, // Reset default padding
    paddingBottom: 10,
    color: '#14171A', // Darker text
    // No explicit minHeight, let it grow naturally with content
    // For ScrollView to work well with TextInput multiline, ensure scrollEnabled={false} on TextInput
  },
  charCount: {
      fontSize: 12,
      color: '#657786',
      textAlign: 'right',
      marginTop: 5,
      marginBottom: 15,
  },
  imagePreviewContainer: {
    marginTop: 20,
    position: 'relative',
    alignSelf: 'center', // Center the image preview
    maxWidth: '100%',
  },
  imagePreview: {
    width: '100%', // Take full width of its container
    aspectRatio: 16 / 9, // Maintain aspect ratio
    borderRadius: 10,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#CED4DA'
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 15,
    padding: 2,
  },
  // If you add a bottom toolbar for actions like adding image:
  bottomToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#F8F9FA', // Light background for toolbar
  },
  toolbarButton: {
    padding: 8,
    marginRight: 15,
  },
  // (Posting indicator styles are fine)
});

export default CreatePostScreen;