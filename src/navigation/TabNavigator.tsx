import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import NoticeScreen from '../screens/NoticeScreen';
import MapScreen from '../screens/MapScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator id="MainTabNavigator"
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.gray,
                tabBarLabelPosition: 'below-icon',
                tabBarStyle: {
                    backgroundColor: COLORS.background,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    borderTopWidth: 0,
                    elevation: 0,
                    shadowOpacity: 0,
                    height: 100,
                    position: 'absolute',
                    bottom: 0,
                }
            }}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈', tabBarIcon: ({ color, size }) => (<Ionicons name="home" size={size} color={color} />) }} />
            <Tab.Screen name="Notice" component={NoticeScreen} options={{ title: '공지사항', tabBarIcon: ({ color, size }) => (<Ionicons name="notifications" size={size} color={color} />) }} />
            <Tab.Screen name="Map" component={MapScreen} options={{ title: '학교지도', tabBarIcon: ({ color, size }) => (<Ionicons name="map-outline" size={size} color={color} />) }} />
            <Tab.Screen name="Calendar" component={CalendarScreen} options={{ title: '캘린더', tabBarIcon: ({ color, size }) => (<Ionicons name="calendar-outline" size={size} color={color} />) }} />
            <Tab.Screen name="All" component={ProfileScreen} options={{ title: '내정보', tabBarIcon: ({ color, size }) => (<Ionicons name="person-outline" size={size} color={color} />) }} />
        </Tab.Navigator>
    );
}
