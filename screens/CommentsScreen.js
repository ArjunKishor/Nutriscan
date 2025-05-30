// screens/CommentsScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput,
  TouchableOpacity, FlatList, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, Alert, StatusBar, Keyboard
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../config/firebase';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, updateDoc, increment, deleteDoc // Added deleteDoc
} from 'firebase/firestore';
import { THEME_COLOR, PLACEHOLDER_AVATAR } from '../config/constants';

const formatDate = (timestamp) => {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate();
  const now = new Date();
  const diffSeconds = Math.round((now - date) / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return `Yesterday`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};


const CommentsScreen = ({ route, navigation }) => {
  const { postId, currentUserData: initialCurrentUserData } = route.params;
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("[CommentsScreen] Initial Post ID:", postId);
    console.log("[CommentsScreen] Initial Current User Data from params:", JSON.stringify(initialCurrentUserData, null, 2));
  }, [postId, initialCurrentUserData]);

  useEffect(() => {
    if (!postId || typeof postId !== 'string' || postId.trim() === '') {
        Alert.alert("Error", "Invalid Post ID. Cannot load comments.", [{ text: "OK", onPress: () => navigation.goBack() }]);
        setIsLoading(false);
        return;
    }

    navigation.setOptions({
        headerTitle: 'Comments',
        headerStyle: { backgroundColor: THEME_COLOR },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15, padding: 5 }}>
                <Ionicons name="arrow-back" size={28} color="#fff" />
            </TouchableOpacity>
        ),
    });

    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc')); // Oldest comments first
    console.log(`[CommentsScreen] Setting up listener for comments at path: posts/${postId}/comments`);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setComments(fetchedComments);
      setIsLoading(false);
      console.log(`[CommentsScreen] Fetched ${fetchedComments.length} comments for postId: ${postId}`);
    }, (error) => {
      console.error("[CommentsScreen] Error fetching comments: ", error);
      Alert.alert("Error Loading Comments", `Could not load comments. ${error.message}`);
      setIsLoading(false);
    });

    return () => {
        console.log(`[CommentsScreen] Unsubscribing from comments listener for postId: ${postId}`);
        unsubscribe();
    };
  }, [postId, navigation]);

  const handleAddComment = async () => {
    Keyboard.dismiss();
    const firebaseCurrentUser = auth.currentUser;

    if (!firebaseCurrentUser) {
      Alert.alert("Authentication Error", "You are not logged in. Please log in to comment.");
      return;
    }
    if (!initialCurrentUserData || !initialCurrentUserData.uid || !initialCurrentUserData.username) {
      Alert.alert("Profile Error", "Your profile information is incomplete.", [{text: "OK"}, {text: "Go to Profile", onPress: () => navigation.navigate('Profile')}]);
      return;
    }
    if (firebaseCurrentUser.uid !== initialCurrentUserData.uid) {
        Alert.alert("User Mismatch", "Authentication issue. Please try logging out and back in.");
        return;
    }
    if (newCommentText.trim() === '') {
      Alert.alert("Empty Comment", "Please write something.");
      return;
    }
    if (!postId) { Alert.alert("Error", "Post ID is missing."); return; }

    setIsSubmitting(true);
    try {
      const commentData = {
        text: newCommentText.trim(),
        userId: initialCurrentUserData.uid,
        username: initialCurrentUserData.username,
        userAvatarUrl: initialCurrentUserData.avatarUrl || PLACEHOLDER_AVATAR,
        createdAt: serverTimestamp(),
        postId: postId,
      };
      await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { commentsCount: increment(1) });
      setNewCommentText('');
    } catch (error) {
      console.error("[CommentsScreen] Error adding comment:", error);
      Alert.alert("Comment Error", `Failed to post comment. ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentIdToDelete, commentAuthorId) => {
    const firebaseCurrentUser = auth.currentUser;
    if (!firebaseCurrentUser || firebaseCurrentUser.uid !== commentAuthorId) {
      // This check is mostly for client-side UX; Firestore rules enforce actual permission
      Alert.alert("Permission Denied", "You can only delete your own comments.");
      return;
    }

    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            console.log(`[CommentsScreen] Attempting to delete comment: ${commentIdToDelete} for post: ${postId}`);
            try {
              const commentRef = doc(db, 'posts', postId, 'comments', commentIdToDelete);
              await deleteDoc(commentRef);
              console.log("[CommentsScreen] Successfully deleted comment:", commentIdToDelete);

              const postRef = doc(db, 'posts', postId);
              await updateDoc(postRef, { commentsCount: increment(-1) });
              console.log("[CommentsScreen] Successfully decremented commentsCount for post:", postId);
            } catch (error) {
              console.error("[CommentsScreen] Error deleting comment: ", error);
              Alert.alert("Delete Error", `Could not delete comment. ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const renderCommentItem = ({ item }) => {
    const isCurrentUserCommentAuthor = initialCurrentUserData?.uid === item.userId;

    return (
      <View style={styles.commentItemContainer}>
        <TouchableOpacity onPress={() => {
            if (item.userId === initialCurrentUserData?.uid) {
                navigation.navigate('Profile');
            } else {
                Alert.alert("View Profile", `Tapped on ${item.username}. Profile view coming soon!`);
            }
        }}>
            <Image
                source={{ uri: item.userAvatarUrl || PLACEHOLDER_AVATAR }}
                style={styles.commentAvatar}
            />
        </TouchableOpacity>
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{item.username}</Text>
            <View style={styles.commentHeaderActions}>
                <Text style={styles.commentTimestamp}>{formatDate(item.createdAt)}</Text>
                {isCurrentUserCommentAuthor && (
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(item.id, item.userId)}
                    style={styles.deleteCommentButton}
                  >
                    <Ionicons name="trash-bin-outline" size={18} color="#E74C3C" />
                  </TouchableOpacity>
                )}
            </View>
          </View>
          <Text style={styles.commentText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <ActivityIndicator size="large" color={THEME_COLOR} />
        <Text style={styles.loadingText}>Loading comments...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0} // Adjust if header height changes
      >
        {comments.length === 0 && !isLoading ? (
            <View style={styles.emptyCommentsContainer}>
                <MaterialCommunityIcons name="comment-multiple-outline" size={60} color="#CED4DA" />
                <Text style={styles.emptyCommentsText}>No comments here yet.</Text>
                <Text style={styles.emptyCommentsSubText}>Why not start the conversation?</Text>
            </View>
        ) : (
            <FlatList
            data={comments}
            renderItem={renderCommentItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContentContainer}
            showsVerticalScrollIndicator={false}
            // inverted // Consider if you want newest at bottom and input fixed
            />
        )}

        <View style={styles.inputContainer}>
          <Image
            source={{ uri: initialCurrentUserData?.avatarUrl || PLACEHOLDER_AVATAR }}
            style={styles.inputAvatar}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Write a comment..."
            placeholderTextColor="#8A94A0"
            value={newCommentText}
            onChangeText={setNewCommentText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (isSubmitting || newCommentText.trim() === '') && styles.sendButtonDisabled]}
            onPress={handleAddComment}
            disabled={isSubmitting || newCommentText.trim() === ''}
          >
            {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Ionicons name="send-outline" size={20} color="#fff" style={{transform: [{rotate: '-45deg'}], marginLeft: -2, marginTop: 2}}/>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeAreaLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555F6E',
  },
  container: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: 12, // Reduced padding for more content width
    paddingTop: 12,
    paddingBottom: 10,
  },
  commentItemContainer: {
    flexDirection: 'row',
    marginBottom: 16, // Slightly less margin
    paddingVertical: 10,
    paddingHorizontal: 8,
    // backgroundColor: '#F8F9FA', // Keeping it, or remove for flat white
    borderRadius: 10,
    // borderBottomWidth: 1, // Alternative: separator line
    // borderBottomColor: '#E9ECEF',
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#E9ECEF',
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to start for timestamp potentially wrapping
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#212529',
    marginRight: 5,
  },
  commentHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentTimestamp: {
    fontSize: 11,
    color: '#6C757D',
    marginRight: 10,
  },
  deleteCommentButton: {
    padding: 3,
  },
  commentText: {
    fontSize: 14,
    color: '#343A40',
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    backgroundColor: '#FFFFFF',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#E9ECEF',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F1F3F5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 8, // Adjust padding for text vertical alignment
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14.5,
    marginRight: 8,
    color: '#212529',
    lineHeight: 18,
  },
  sendButton: {
    backgroundColor: THEME_COLOR,
    borderRadius: 18, // Slightly less round
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  emptyCommentsText: {
    fontSize: 17,
    color: '#495057',
    marginTop: 16,
    fontWeight: '600',
  },
  emptyCommentsSubText: {
      fontSize: 13.5,
      color: '#6C757D',
      marginTop: 6,
      textAlign: 'center',
      lineHeight: 19,
  }
});

export default CommentsScreen;