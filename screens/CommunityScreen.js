// screens/CommunityScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView,
  TextInput, Image, TouchableOpacity, FlatList,
  Platform, StatusBar, ActivityIndicator, Alert,
  RefreshControl, Dimensions, Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import {
  collection, query, orderBy, onSnapshot, doc, getDoc,
  updateDoc, arrayUnion, arrayRemove, increment, deleteDoc, // Added deleteDoc
} from 'firebase/firestore';
import PostCard from '../components/PostCard'; // Make sure this path is correct
import { THEME_COLOR, LOGO_URL, PLACEHOLDER_AVATAR } from '../config/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CommunityScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [deletingPostId, setDeletingPostId] = useState(null); // For loading on specific post deletion

  const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

  const filteredPosts = posts.filter(post =>
    post.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const fetchCurrentUserProfile = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const userDocRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          setCurrentUserProfile(docSnap.data());
        } else {
          console.warn("[CommunityScreen] Current user profile not found in Firestore.");
        }
      } catch (error) {
        console.error("[CommunityScreen] Error fetching user profile:", error);
      }
    }
  }, []);


  useEffect(() => {
    fetchCurrentUserProfile();

    const postsCollectionRef = collection(db, 'posts');
    const q = query(postsCollectionRef, orderBy('createdAt', 'desc'));

    if (posts.length === 0) { // Only set initial loading if posts are empty
        setIsLoading(true);
    }
    console.log("[CommunityScreen] Setting up posts listener.");

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedPosts = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setPosts(fetchedPosts);
      if (isLoading) setIsLoading(false);
      if (refreshing) setRefreshing(false);
      console.log(`[CommunityScreen] Fetched ${fetchedPosts.length} posts.`);
    }, (error) => {
      console.error("[CommunityScreen] Error fetching posts with onSnapshot: ", error);
      Alert.alert("Error", `Could not fetch community posts. ${error.message}`);
      setIsLoading(false);
      setRefreshing(false);
    });

    return () => {
        console.log("[CommunityScreen] Unsubscribing from posts listener.");
        unsubscribe();
    };
  }, []); // Removed dependencies that might cause re-subscriptions unnecessarily, let onRefresh handle explicit re-fetch logic for profile

  const onRefresh = useCallback(() => {
    console.log("[CommunityScreen] Refresh triggered.");
    setRefreshing(true);
    fetchCurrentUserProfile(); // Refresh user profile
    // The onSnapshot listener for posts will automatically update.
    // setRefreshing(false) is handled within the onSnapshot callback.
  }, [fetchCurrentUserProfile]);


  const handleCreatePost = () => {
    if (!currentUserId) {
        Alert.alert("Login Required", "Please log in to create a post.");
        return;
    }
    if (!currentUserProfile || !currentUserProfile.username) { // Check for username as a proxy for complete profile
        Alert.alert("Profile Incomplete", "Please complete your profile (especially username) before posting.", [
            { text: "OK" },
            { text: "Go to Profile", onPress: () => navigation.navigate('Profile') }
        ]);
        return;
    }
    navigation.navigate('CreatePost');
  };

  const handleLikeToggle = async (postId, isCurrentlyLiked) => {
    if (!currentUserId) {
      Alert.alert("Not Logged In", "You need to be logged in to like posts.");
      return;
    }
    const postRef = doc(db, "posts", postId);
    try {
      await updateDoc(postRef, {
        likesCount: increment(isCurrentlyLiked ? -1 : 1),
        likedBy: isCurrentlyLiked ? arrayRemove(currentUserId) : arrayUnion(currentUserId)
      });
    } catch (error) {
      console.error("[CommunityScreen] Error updating like: ", error);
      Alert.alert("Error", `Could not update like status. ${error.message}`);
    }
  };

  const handleCommentPress = (postId) => {
    if (!currentUserId) {
        Alert.alert("Login Required", "Please log in to view or add comments.");
        return;
    }
    if (!currentUserProfile || !currentUserProfile.username) {
        Alert.alert("Profile Incomplete", "Please complete your profile (especially username) before commenting.", [
            { text: "OK" },
            { text: "Go to Profile", onPress: () => navigation.navigate('Profile') }
        ]);
        return;
    }
    navigation.navigate('Comments', {
        postId: postId,
        currentUserData: {
            uid: currentUserId,
            username: currentUserProfile.username,
            avatarUrl: currentUserProfile.avatarUrl
        }
    });
  };

  const handleSharePress = async (postText, postId) => {
    try {
      const appName = "YourAppName"; // Replace with your app's name
      const result = await Share.share({
        message: `${postText}\n\nShared from ${appName} (View post: yourapp://post/${postId})`,
        title: 'Check out this post!',
      });
      if (result.action === Share.sharedAction) {
        console.log(`[CommunityScreen] Post ${postId} shared via ${result.activityType || 'unknown'}`);
      } else if (result.action === Share.dismissedAction) {
        console.log('[CommunityScreen] Share dismissed');
      }
    } catch (error) {
      Alert.alert("Share Error", error.message);
    }
  };

  const handleDeletePost = async (postIdToDelete) => {
    if (!currentUserId) {
      Alert.alert("Not Logged In", "You need to be logged in to delete posts.");
      return;
    }
    // Ensure only the author can initiate delete from client, though rules enforce it
    const postToDelete = posts.find(p => p.id === postIdToDelete);
    if (postToDelete && postToDelete.userId !== currentUserId) {
        Alert.alert("Permission Denied", "You can only delete your own posts.");
        return;
    }

    setDeletingPostId(postIdToDelete);
    console.log(`[CommunityScreen] Attempting to delete post: ${postIdToDelete}`);
    try {
      const postRef = doc(db, "posts", postIdToDelete);
      await deleteDoc(postRef);
      // Alert.alert("Post Deleted", "Your post has been successfully deleted."); // Optional, UI update is often enough
      console.log(`[CommunityScreen] Successfully deleted post: ${postIdToDelete}`);
      // onSnapshot listener will update the posts list.
      // NOTE: Subcollections (comments, etc.) are NOT automatically deleted.
      // This requires a Firebase Cloud Function for proper cleanup in production.
    } catch (error) {
      console.error("[CommunityScreen] Error deleting post: ", error);
      Alert.alert("Error", `Could not delete the post. ${error.message}`);
    } finally {
      setDeletingPostId(null);
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.customHeader}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: LOGO_URL }} style={styles.headerLogo} />
          <Text style={styles.headerTitle}>COMMUNITY</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.profileButton}
        >
          <Image
            source={{ uri: currentUserProfile?.avatarUrl || PLACEHOLDER_AVATAR }}
            style={styles.headerProfileIcon}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={[
          styles.searchInputContainer,
          isSearchFocused && styles.searchInputContainerFocused
        ]}>
          <Ionicons
            name="search-outline"
            size={20}
            color={isSearchFocused ? THEME_COLOR : "#999"}
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search posts or users..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <MaterialCommunityIcons
          name="forum-outline"
          size={screenWidth * 0.15}
          color="#E0E0E0"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No posts found' : 'Welcome to the Community!'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery
          ? `We couldn't find any posts matching "${searchQuery}". Try a different search.`
          : 'Be the first to share your thoughts, ask questions, or connect with others.'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={handleCreatePost}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle-outline" size={22} color="#fff" style={styles.emptyActionIcon} />
          <Text style={styles.emptyActionText}>Create a New Post</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (isLoading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
        {renderHeader()} {/* Show header even during initial load for better UX */}
        <View style={styles.loadingIndicatorContainer}>
          <ActivityIndicator size="large" color={THEME_COLOR} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      {renderHeader()}
      <FlatList
        data={filteredPosts}
        renderItem={({ item }) => (
          <View style={styles.postCardWrapper}>
            <PostCard
              post={item}
              currentUserId={currentUserId}
              currentUserAvatarUrl={currentUserProfile?.avatarUrl}
              onLikeToggle={handleLikeToggle}
              onCommentPress={handleCommentPress}
              onSharePress={handleSharePress}
              onUserPress={(userId, username) => {
                if (userId === currentUserId) {
                  navigation.navigate('Profile');
                } else {
                  Alert.alert("View Profile", `Tapped on ${username || 'user'}. Profile view coming soon!`);
                  // navigation.navigate('UserProfileScreen', { userId, username });
                }
              }}
              onDeletePost={handleDeletePost} // Pass the delete handler
              navigation={navigation}
            />
            {deletingPostId === item.id && (
              <View style={styles.postDeletingOverlay}>
                <ActivityIndicator color={'#fff'} size="small" />
                <Text style={styles.postDeletingText}>Deleting...</Text>
              </View>
            )}
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          filteredPosts.length === 0 && styles.listContainerEmpty
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!isLoading ? renderEmptyComponent : null} // Show empty only if not loading
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME_COLOR]}
            tintColor={THEME_COLOR}
            progressBackgroundColor="#fff"
          />
        }
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <Ionicons name="create-outline" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  loadingIndicatorContainer: { // Centered loading for posts list
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  headerContainer: {
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  customHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME_COLOR,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 8 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  profileButton: {
    padding: 4,
  },
  headerProfileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2F5',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInputContainerFocused: {
    borderColor: THEME_COLOR,
    backgroundColor: '#fff',
    shadowColor: THEME_COLOR,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 5,
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: screenHeight * 0.15,
  },
  listContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  postCardWrapper: { // Wrapper for PostCard and its potential overlay
    position: 'relative', // Needed for absolute positioning of overlay
  },
  postDeletingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay for visibility
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8, // Match PostCard border radius
    marginHorizontal: Platform.OS === 'ios' ? 0 : 5, // Match PostCard margin
    marginBottom: 10, // Match PostCard margin
  },
  postDeletingText: {
    marginTop: 8,
    fontSize: 13,
    color: '#fff',
    fontWeight: '500',
  },
  postSeparator: {
    height: 8,
    backgroundColor: '#F0F2F5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: screenHeight * 0.1,
  },
  emptyIconContainer: {
    backgroundColor: '#E9ECEF',
    padding: screenWidth * 0.05,
    borderRadius: screenWidth * 0.1,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: screenWidth * 0.055,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: screenWidth * 0.04,
    color: '#555',
    textAlign: 'center',
    lineHeight: screenWidth * 0.055,
    marginBottom: 25,
  },
  emptyActionButton: {
    backgroundColor: THEME_COLOR,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  emptyActionIcon: {
    marginRight: 8,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: screenWidth * 0.04,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 30 : 25,
    backgroundColor: THEME_COLOR,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    zIndex: 1000,
  },
});
export default CommunityScreen;