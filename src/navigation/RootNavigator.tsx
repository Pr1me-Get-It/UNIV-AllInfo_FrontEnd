import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import DetailScreen from '../screens/DetailScreen';
import KeywordScreen from '../screens/KeywordScreen';
import BookmarkScreen from '../screens/BookmarkScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
    return (
        <Stack.Navigator id="RootStackNavigator">
            <Stack.Screen name="MainTab" component={TabNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Detail" component={DetailScreen} options={{ title: '상세 정보' }} />
            <Stack.Screen name="Keyword" component={KeywordScreen} options={{ title: '뒤로가기', headerShown: true, headerTintColor: '#000' }} />
            <Stack.Screen name="Bookmark" component={BookmarkScreen} options={{ title: '뒤로가기', headerShown: true }} />
        </Stack.Navigator>
    );
}
