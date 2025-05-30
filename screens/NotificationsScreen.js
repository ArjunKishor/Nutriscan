// screens/NotificationsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList,
  TouchableOpacity, StatusBar, Platform, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME_COLOR_PRIMARY as THEME_COLOR } from '../config/dummyData'; // Or your constants
import { formatDistanceToNowStrict } from 'date-fns';

// Dummy notifications data
const DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    type: 'scan_complete',
    title: 'Scan Complete: Pepsi Can',
    message: 'We\'ve analyzed your ingredients for Pepsi Can. View detailed insights now!',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    read: false,
    data: { productId: 'pepsi123', screen: 'ProductDetail' } // Example data for navigation
  },
  {
    id: '2',
    type: 'new_post_community',
    title: 'New Post in "Healthy Snacks"',
    message: 'User "FitFoodie" shared a new recipe for energy bars.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    data: { postId: 'postABC', screen: 'PostDetail' }
  },
  {
    id: '3',
    type: 'contribution_approved',
    title: 'Contribution Approved: Organic Oats',
    message: 'Your product contribution "Organic Oats" has been approved and added to the database. Thank you!',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 25), // Yesterday
    read: true,
    data: { productId: 'oats789', screen: 'ProductDetail' }
  },
  {
    id: '4',
    type: 'scan_complete',
    title: 'Scan Complete: Whole Milk',
    message: 'Analysis for Whole Milk is ready. Check for allergens and nutritional info.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: true,
    data: { productId: 'milk456', screen: 'ProductDetail' }
  },
  // Add more diverse notifications
];

const getIconForNotificationType = (type) => {
  switch (type) {
    case 'scan_complete':
      return 'barcode-outline';
    case 'new_post_community':
      return 'chatbubbles-outline';
    case 'contribution_approved':
      return 'checkmark-circle-outline';
    case 'allergy_alert':
      return 'warning-outline';
    default:
      return 'notifications-outline';
  }
};


const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState(DUMMY_NOTIFICATIONS);

  useEffect(() => {
    navigation.setOptions({
      title: 'Notifications',
      headerStyle: { backgroundColor: THEME_COLOR },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15, padding:5 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
      ),
    });
    // Mark all as read when screen is opened (optional)
    // setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, [navigation]);

  const handleNotificationPress = (item) => {
    console.log("Notification pressed:", item);
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));

    // Navigate based on item.data (example)
    // if (item.data && item.data.screen && item.data.productId) {
    //   navigation.navigate(item.data.screen, { productId: item.data.productId });
    // } else if (item.data && item.data.screen && item.data.postId) {
    //   navigation.navigate(item.data.screen, { postId: item.data.postId });
    // }
    Alert.alert(item.title, item.message); // Placeholder action
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadItem]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons
            name={getIconForNotificationType(item.type)}
            size={26}
            color={!item.read ? THEME_COLOR : '#555'}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatDistanceToNowStrict(item.timestamp, { addSuffix: true })}
        </Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  const groupNotificationsByDate = (notifs) => {
    const groups = { Today: [], Yesterday: [], Earlier: [] };
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    notifs.forEach(notif => {
      const notifDate = notif.timestamp;
      if (notifDate.toDateString() === today.toDateString()) {
        groups.Today.push(notif);
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        groups.Yesterday.push(notif);
      } else {
        groups.Earlier.push(notif);
      }
    });
    return groups;
  };

  const groupedNotifications = groupNotificationsByDate(notifications);
  const sections = Object.keys(groupedNotifications)
    .map(key => ({ title: key, data: groupedNotifications[key] }))
    .filter(section => section.data.length > 0);


  if (notifications.length === 0) {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={70} color="#ccc" />
                <Text style={styles.emptyText}>No Notifications Yet</Text>
                <Text style={styles.emptySubText}>Check back later for updates!</Text>
            </View>
        </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME_COLOR} />
      <FlatList // Using FlatList instead of SectionList for simplicity with current grouping
        data={notifications.sort((a,b) => b.timestamp - a.timestamp)} // Show newest first
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
      />
      {/*
      // If you want SectionList for "Today", "Yesterday", "Earlier"
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderNotificationItem}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionHeader}>{title}</Text>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContainer}
        stickySectionHeadersEnabled={false}
      />
      */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  listContainer: {
    paddingVertical: 10,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    backgroundColor: '#F4F6F8',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 5,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  unreadItem: {
    backgroundColor: '#E8F5E9', // Light green for unread
    borderLeftWidth: 4,
    borderLeftColor: THEME_COLOR,
  },
  iconContainer: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius:20,
    backgroundColor: '#eef2f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 3,
  },
  notificationMessage: {
    fontSize: 13.5,
    color: '#566573',
    lineHeight: 19,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME_COLOR,
    marginLeft: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#EDF2F7',
    // marginLeft: 70, // Align with text if icon is on left
  },
  emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 30,
  },
  emptyText: {
      fontSize: 20,
      fontWeight: '600',
      color: '#777',
      marginTop: 15,
  },
  emptySubText: {
      fontSize: 14,
      color: '#aaa',
      marginTop: 8,
      textAlign: 'center',
  }
});

export default NotificationsScreen;