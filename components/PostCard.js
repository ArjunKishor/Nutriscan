// components/PostCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform, Alert } from 'react-native'; // Added Alert
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNowStrict } from 'date-fns';
import { PLACEHOLDER_AVATAR, THEME_COLOR } from '../config/constants';

const PostCard = ({
  post,
  currentUserId,
  currentUserAvatarUrl,
  onLikeToggle,
  onCommentPress,
  onSharePress,
  onUserPress,
  onDeletePost, // <-- New prop for deleting a post
  navigation,
}) => {
  const timeAgo = post.createdAt
    ? formatDistanceToNowStrict(post.createdAt.toDate(), { addSuffix: true })
    : 'just now';

  const isLikedByCurrentUser = post.likedBy && post.likedBy.includes(currentUserId);
  const commentsCount = post.commentsCount || 0;
  const isCurrentUserPostAuthor = post.userId === currentUserId; // Check if current user is the author

  const handleDeletePress = () => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onDeletePost && onDeletePost(post.id) }
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.postHeader}>
        <TouchableOpacity
          onPress={() => onUserPress && onUserPress(post.userId, post.username)}
          style={styles.userInfo}
        >
          <Image
            source={{ uri: post.userAvatarUrl || PLACEHOLDER_AVATAR }}
            style={styles.userAvatarSmall}
          />
          <View>
            <Text style={styles.userName}>{post.username || 'Anonymous'}</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
            <Text style={styles.postTimestamp}>{timeAgo}</Text>
            {isCurrentUserPostAuthor && ( // Show delete option only if current user is the author
              <TouchableOpacity onPress={handleDeletePress} style={styles.moreOptionsButton}>
                <Ionicons name="trash-outline" size={22} color="#E74C3C" />
              </TouchableOpacity>
            )}
        </View>
      </View>

      {post.text && <Text style={styles.postText}>{post.text}</Text>}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.postFooter}>
        <TouchableOpacity
          style={styles.commentPreview}
          onPress={() => onCommentPress && onCommentPress(post.id)}
        >
          {currentUserAvatarUrl && (
            <Image
              source={{ uri: currentUserAvatarUrl }}
              style={styles.commentAvatar}
            />
          )}
          <Text style={styles.commentPreviewText}>
            {commentsCount > 0
              ? `${commentsCount} Comment${commentsCount > 1 ? 's' : ''}`
              : 'Add a comment...'}
          </Text>
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLikeToggle && onLikeToggle(post.id, isLikedByCurrentUser)}
          >
            <Ionicons
              name={isLikedByCurrentUser ? 'heart' : 'heart-outline'}
              size={24}
              color={isLikedByCurrentUser ? THEME_COLOR : '#555'}
            />
            <Text
              style={[
                styles.actionText,
                isLikedByCurrentUser && { color: THEME_COLOR, fontWeight: 'bold' },
              ]}
            >
              {post.likesCount || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onCommentPress && onCommentPress(post.id)}
          >
            <Ionicons name="chatbubble-outline" size={23} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSharePress && onSharePress(post.text, post.id)}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
              size={23}
              color="#555"
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ... (previous styles)
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: Platform.OS === 'ios' ? 0 : 5,
    marginBottom: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#EEE',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow user info to take available space
  },
  userAvatarSmall: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    backgroundColor: '#E9ECEF',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#212529',
  },
  headerActions: { // Container for timestamp and more options
    flexDirection: 'row',
    alignItems: 'center',
  },
  postTimestamp: {
    fontSize: 12,
    color: '#6C757D',
    marginRight: 10, // Space before more options button
  },
  moreOptionsButton: {
    padding: 5, // Increase touchable area
  },
  postText: {
    fontSize: 14.5,
    lineHeight: 21,
    color: '#343A40',
    marginBottom: 10,
  },
  postImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 6,
    marginBottom: 10,
    backgroundColor: '#E9ECEF',
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  commentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexShrink: 1, // Allow it to shrink if actionsContainer needs more space
    maxWidth: '55%', // Prevent it from taking too much space
    marginRight: 5,
  },
  commentAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginRight: 8,
    backgroundColor: '#E0E0E0',
  },
  commentPreviewText: {
    fontSize: 13,
    color: '#495057',
    flexShrink: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end', // Align actions to the right
    flexGrow: 1, // Allow it to take remaining space
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 6,
    marginLeft: Platform.OS === 'ios' ? 6 : 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13.5,
    color: '#555',
    fontWeight: '500',
  },
});

export default PostCard;