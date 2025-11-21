// screens/HomeScreen.jsx
import React, { useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AlramContext } from './data/Alram'; 
import { ALRAM_DATA } from './data/mockAlrams';


export default function HomeScreen({ navigation }) {
    const { readStatus } = useContext(AlramContext) || { readStatus: {} };
    const safeStatus = readStatus || {};
    const safeData = ALRAM_DATA || []; 
    const unreadCount = safeData.filter(item => !safeStatus[item.id]).length;

    return (
        <View style={styles.container}>
            
            <View style={styles.headerContainer}>
                <Ionicons name='notifications' size={28} color='rgba(50, 50, 50, 0.7)' />
                <Text style={styles.headerText}>알림함</Text>
            </View>

            
            <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>확인하지 않은 알림</Text>
                <Text style={styles.balanceText}>
                    {unreadCount} 개
                </Text>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={ALRAM_DATA}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    renderItem={({ item }) => {
                        if (!item) return null;
                        const isRead = safeStatus[item.id] === true;

                        return (
                            <TouchableOpacity
                                style={styles.itemRow}
                                onPress={() => navigation.navigate('Detail', { item })}
                            >
                                <View style={styles.iconBackground}>
                                    <Image source={item.image} style={styles.customIcon} />
                                </View>

                                <View style={styles.textWrapper}>
                                    <Text style={[
                                        styles.itemText, 
                                        isRead && styles.readText 
                                    ]}>
                                        {item.title}
                                    </Text>
                                    

                                    {isRead ? (
                                        <Text style={styles.readLabel}>읽음</Text>
                                    ) : (
                                        <Text style={styles.unreadLabel}>NEW</Text>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 60, backgroundColor: '#f5f5f5' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginLeft: 20 },
    headerText: { fontSize: 24, fontWeight: 'bold', marginLeft: 10, color: 'rgba(50, 50, 50, 0.7)' },
    

    balanceContainer: { backgroundColor: 'rgb(219, 31, 38)', margin: 20, padding: 20, borderRadius: 15, alignItems: 'center' },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    balanceText: { color: 'white', fontSize: 28, fontWeight: 'bold' },
    
    listContainer: { flex: 1,backgroundColor: 'white', borderRadius: 20, marginHorizontal: 20, marginBottom: 100 ,paddingVertical: 10 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: 'rgba(238, 238, 238, 1)' },
    

    iconBackground: { backgroundColor: 'transparent', width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    customIcon: { width: 40, height: 40, resizeMode: 'contain' },
    
    textWrapper: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    
    itemText: { fontSize: 16, color: '#333', fontWeight: '500' },

    readText: { color: '#aaa', textDecorationLine: 'none' },

    unreadLabel: { fontSize: 14, color: 'rgb(219, 31, 38)', fontWeight: 'bold' }, 
    readLabel: { fontSize: 14, color: '#bbb', fontWeight: 'normal' }, 
});