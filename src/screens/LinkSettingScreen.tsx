import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DraggableGrid } from 'react-native-draggable-grid';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { AVAILABLE_LINKS } from '../constants/links';
import { COLORS } from '../constants/colors';
import AppText from '../components/AppText';
import { moderateScale } from '../utils/responsive';

type LinkSettingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LinkSetting'>;

interface Props {
    navigation: LinkSettingNavigationProp;
}

const CUSTOM_LINKS_KEY = 'CUSTOM_LINKS';
const DEFAULT_LINK_IDS = ['knu_main', 'knu_plan', 'knu_score', 'knu_sugang'];

export default function LinkSettingScreen({ navigation }: Props) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [gridData, setGridData] = useState(
        AVAILABLE_LINKS.map(link => ({ ...link, key: link.id }))
    );
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const storedSelected = await AsyncStorage.getItem(CUSTOM_LINKS_KEY);
            let currentSelected = DEFAULT_LINK_IDS;
            if (storedSelected) {
                currentSelected = JSON.parse(storedSelected);
            }
            setSelectedIds(currentSelected);

            const storedOrder = await AsyncStorage.getItem('ALL_LINKS_ORDER');
            if (storedOrder) {
                const orderArray = JSON.parse(storedOrder) as string[];
                const reorderedData = [...AVAILABLE_LINKS]
                    .map(link => ({ ...link, key: link.id }))
                    .sort((a, b) => {
                        const idxA = orderArray.indexOf(a.id);
                        const idxB = orderArray.indexOf(b.id);
                        return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
                    });
                setGridData(reorderedData);
            } else {
                setGridData(AVAILABLE_LINKS.map(link => ({ ...link, key: link.id })));
            }
        } catch (error) {
            console.error('Failed to load custom links settings', error);
            setSelectedIds(DEFAULT_LINK_IDS);
            setGridData(AVAILABLE_LINKS.map(link => ({ ...link, key: link.id })));
        } finally {
            setIsLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            if (selectedIds.length === 0) {
                Alert.alert('알림', '최소 1개 이상의 링크를 선택해주세요.');
                return;
            }
            // 최종 정렬된 데이터를 바탕으로, 선택된 항목들의 ID를 순서대로 추출
            const orderedSelectedIds = gridData
                .filter(item => selectedIds.includes(item.id))
                .map(item => item.id);

            await AsyncStorage.setItem(CUSTOM_LINKS_KEY, JSON.stringify(orderedSelectedIds));
            await AsyncStorage.setItem('ALL_LINKS_ORDER', JSON.stringify(gridData.map(item => item.id)));

            navigation.goBack();
        } catch (error) {
            Alert.alert('오류', '설정을 저장하는데 실패했습니다.');
            console.error('Failed to save custom links settings', error);
        }
    };

    const toggleLink = (id: string) => {
        setSelectedIds(prev => {
            if (prev.includes(id)) {
                return prev.filter(item => item !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    if (isLoading) return <View style={styles.container} />;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                        <Ionicons name="chevron-back" size={28} color="#111" />
                    </TouchableOpacity>
                    <AppText style={styles.headerTitle}>홈 화면 설정</AppText>
                    <TouchableOpacity onPress={saveSettings} style={styles.headerButton}>
                        <AppText style={styles.saveText}>완료</AppText>
                    </TouchableOpacity>
                </View>

                {/* 본문 설명 */}
                <View style={styles.descriptionContainer}>
                    <AppText style={styles.descriptionTitle}>바로가기 링크 편집</AppText>
                    <AppText style={styles.descriptionText}>
                        홈 화면에 표시할 수 있는 링크 메뉴입니다.{'\n'}원하는 링크를 선택하거나 해제해보세요.
                    </AppText>
                </View>

                {/* 링크 목록 */}
                <View style={styles.gridOuterWrapper}>
                    <DraggableGrid
                        numColumns={4}
                        onItemPress={(item) => toggleLink(item.id)}
                        renderItem={(item) => {
                            const isSelected = selectedIds.includes(item.id);
                            return (
                                <View
                                    key={item.key}
                                    style={styles.linkItem}
                                >
                                    <View style={[styles.iconWrapper, isSelected && styles.iconWrapperSelected]}>
                                        <Ionicons
                                            name={item.icon as any}
                                            size={28}
                                            color={isSelected ? COLORS.primary : '#9CA3AF'}
                                        />
                                    </View>
                                    <View style={styles.textContainer}>
                                        <AppText style={[styles.linkTitle, isSelected && styles.linkTitleSelected]} numberOfLines={2}>
                                            {item.title}
                                        </AppText>
                                    </View>
                                </View>
                            );
                        }}
                        data={gridData}
                        onDragRelease={(newData) => {
                            setGridData(newData);
                        }}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        height: 60,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerButton: {
        padding: 8,
        minWidth: 44, // 터치 영역 확보
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: moderateScale(18, 0.3),
        fontWeight: 'bold',
        color: '#111',
    },
    saveText: {
        fontSize: moderateScale(16, 0.3),
        fontWeight: 'bold',
        color: COLORS.primary,
        textAlign: 'right',
    },
    descriptionContainer: {
        padding: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    descriptionTitle: {
        fontSize: moderateScale(18, 0.3),
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: moderateScale(14, 0.3),
        color: '#6B7280',
        lineHeight: moderateScale(20, 0.3),
    },
    gridOuterWrapper: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        paddingBottom: 40,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        flex: 1, // 리스트가 넘어갈 경우 뷰포트 확보
    },
    linkItem: {
        width: '100%',
        height: 100, // 카드의 고정 높이 지정 (드래그 시 크기 유지)
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    iconWrapper: {
        width: moderateScale(48, 0.3),
        height: moderateScale(48, 0.3),
        borderRadius: 16,
        backgroundColor: '#F3F4F6', // 회색 (미선택)
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconWrapperSelected: {
        backgroundColor: 'rgba(219, 31, 38, 0.05)', // 빨간색 틴트 (선택)
    },
    textContainer: {
        width: '100%',
        alignItems: 'center',
    },
    linkTitle: {
        fontSize: moderateScale(12, 0.3),
        fontWeight: 'bold',
        color: '#9CA3AF', // 회색 (미선택)
        textAlign: 'center',
        lineHeight: moderateScale(16, 0.3),
    },
    linkTitleSelected: {
        color: COLORS.primary, // 빨간색 (선택)
    },
});
