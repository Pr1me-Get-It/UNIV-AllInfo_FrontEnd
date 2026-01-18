/* App.jsx */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// 화면들 import
import HomeScreen from './screen/HomeScreen';
import DetailScreen from './screen/DetailScreen';
import { AuthProvider } from './context/AuthContext';
import { AlarmProvider } from './data/Alarm';
import BookmarkScreen from './screen/BookmarkScreen';
import CalendarScreen from './screen/CalendarScreen';
import SettingsScreen from './screen/SettingsScreen';
import KeywordScreen from './screen/KeywordScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: 'rgb(219, 31, 38)',
        tabBarInactiveTintColor: 'gray',
        tabBarLabelPosition: 'below-icon',
        tabBarStyle: {
          backgroundColor: '#ffffff',
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Bookmark"
        component={BookmarkScreen}
        options={{
          title: '북마크',
          tabBarIcon: ({ color, size }) => (<Ionicons name="star" size={size} color={color} />),
        }}
      />
      <Tab.Screen
        name="Keyword"
        component={KeywordScreen}
        options={{
          title: '키워드',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetags" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          title: '캘린더',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="All"
        component={SettingsScreen}
        options={{
          title: '설정',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AlarmProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="MainTab"
              component={MainTab}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={{ title: '상세 정보' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AlarmProvider>
    </AuthProvider>
  );
}