// screen/FilterScreen.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { AlramContext } from '../data/Alram';
import { ALRAM_DATA } from '../data/mockAlrams';

const PRIMARY = 'rgb(219, 31, 38)';

export default function FilterScreen({ navigation }) {           
  // 읽음 상태는 기존 AlramContext 그대로 사용
  const { readStatus } = useContext(AlramContext) || { readStatus: {} };
  const safeStatus = readStatus || {};

  // 전체 알림 목록 (서버 or 목업)
  const [allNotices, setAllNotices] = useState([]);

  // 키워드 입력값 + 저장된 키워드 목록 + 펼치기 상태
  const [keywordInput, setKeywordInput] = useState('');
  const [keywords, setKeywords] = useState([]);
  const [expanded, setExpanded] = useState({});

  // ❶ 필터 화면이 처음 열릴 때, 공지 목록 한 번 불러오기
  useEffect(() => {
    let isActive = true;

    const fetchNoticesForFilter = async () => {
      try {
        // HomeScreen에서 쓰는 것과 같은 엔드포인트
        const response = await api.get('/notice', { params: { p: 1 } });
        const { notices } = response.data || {};
        const safeNotices = Array.isArray(notices) ? notices : [];

        if (isActive) {
          setAllNotices(safeNotices);
        }
      } catch (error) {
        console.error('필터 화면 공지 조회 실패 (목업 데이터 사용):', error);
        if (isActive) {
          const safeMock = Array.isArray(ALRAM_DATA) ? ALRAM_DATA : [];
          setAllNotices(safeMock);
        }
      }
    };

    fetchNoticesForFilter();

    return () => {
      isActive = false;
    };
  }, []);

  // ❷ 키워드 추가
  const handleAddKeyword = () => {
    const trimmed = keywordInput.trim();
    if (!trimmed) {
      Alert.alert('알림', '키워드를 입력해주세요.');
      return;
    }
    if (keywords.includes(trimmed)) {
      Alert.alert('알림', '이미 추가된 키워드입니다.');
      setKeywordInput('');
      return;
    }
    setKeywords((prev) => [...prev, trimmed]);
    setKeywordInput('');
  };

  // ❸ 키워드 삭제
  const handleRemoveKeyword = (word) => {
    setKeywords((prev) => prev.filter((k) => k !== word));
    setExpanded((prev) => {
      const copy = { ...prev };
      delete copy[word];
      return copy;
    });
  };

  // ❹ 키워드별로 알림 필터링 (제목/내용에 키워드 포함 여부)
  const getMatchedNotices = (keyword) => {
    const lower = keyword.toLowerCase();
    const base = Array.isArray(allNotices) ? allNotices : [];

    return base.filter((item) => {
      if (!item) return false;
      const title = (item.title || '').toLowerCase();
      const content = (item.content || '').toLowerCase();
      return title.includes(lower) || content.includes(lower);
    });
  };

  // ❺ 키워드 카드 펼치기/접기 토글
  const toggleKeyword = (word) => {
    setExpanded((prev) => ({
      ...prev,
      [word]: !prev[word],
    }));
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.headerContainer}>
        <Ionicons name="filter-outline" size={24} color="rgba(50,50,50,0.7)" />
        <Text style={styles.headerText}>필터</Text>
      </View>

      {/* 키워드 입력 영역 */}
      <View style={styles.inputCard}>
        <Text style={styles.inputLabel}>키워드 추가</Text>
        <Text style={styles.inputDescription}>
          예: 장학, 공모전, 인턴십, 대회, 봉사…
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="키워드를 입력하세요"
            placeholderTextColor="#999"
            value={keywordInput}
            onChangeText={setKeywordInput}
            onSubmitEditing={handleAddKeyword}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAddKeyword}>
            <Text style={styles.addButtonText}>추가</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 키워드 목록 + 알림 리스트 */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {keywords.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              아직 저장된 키워드가 없습니다.{'\n'}
              위 입력창에서 키워드를 추가해보세요.
            </Text>
          </View>
        ) : (
          keywords.map((keyword) => {
            const notices = getMatchedNotices(keyword);
            const isOpened = !!expanded[keyword];

            return (
              <View key={keyword} style={styles.keywordCard}>
                {/* 키워드 헤더 (토글 + 삭제 버튼) */}
                <TouchableOpacity
                  style={styles.keywordHeader}
                  onPress={() => toggleKeyword(keyword)}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.keywordBadge}>
                      <Text style={styles.keywordBadgeText}>KW</Text>
                    </View>
                    <View>
                      <Text style={styles.keywordText}>{keyword}</Text>
                      <Text style={styles.keywordCount}>
                        {notices.length}개의 알림
                      </Text>
                    </View>
                  </View>

                  <View style={styles.keywordHeaderRight}>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleRemoveKeyword(keyword)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#888"
                      />
                    </TouchableOpacity>
                    <Ionicons
                      name={isOpened ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#666"
                    />
                  </View>
                </TouchableOpacity>

                {/* 펼쳐졌을 때 알림 리스트 */}
                {isOpened && (
                  <View style={styles.noticeList} >
                    {notices.length === 0 ? (
                      <View style={styles.noticeEmptyBox}>
                        <Text style={styles.noticeEmptyText}>
                          이 키워드에 해당하는 알림이 없습니다.
                        </Text>
                      </View>
                    ) : (
                      notices.map((item) => {
                        const isRead = safeStatus[item.id] === true;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={styles.noticeItem}
                            onPress={() =>
                              navigation.navigate('Detail', { item })
                            }
                          >
                            <View style={styles.noticeIconWrapper}>
                              <Ionicons
                                name="notifications-outline"
                                size={20}
                                color={isRead ? '#bbb' : PRIMARY}
                              />
                            </View>

                            <View style={styles.noticeTextWrapper}>
                              <Text
                                style={[
                                  styles.noticeTitle,
                                  isRead && styles.noticeTitleRead,
                                ]}
                                numberOfLines={1}
                              >
                                {item.title}
                              </Text>
                              <Text style={styles.noticeMeta} numberOfLines={1}>
                                {(item.source || '출처 없음') +
                                  (item.date ? ` · ${item.date}` : '')}
                              </Text>
                            </View>

                            <View style={styles.noticeRight}>
                              {isRead ? (
                                <Text style={styles.readLabel}>읽음</Text>
                              ) : (
                                <Text style={styles.unreadLabel}>NEW</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60, backgroundColor: '#f5f5f5' },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 10,
    color: 'rgba(50, 50, 50, 0.7)',
  },

  inputCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#111827',
  },
  inputDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#f9fafb',
    color: '#111827',
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },

  scrollArea: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 4,
  },

  emptyBox: {
    padding: 40,
    marginTop: 12,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  keywordCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 10,
    overflow: 'hidden',
  },
  keywordHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  keywordBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(219,31,38,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  keywordBadgeText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '700',
  },
  keywordText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  keywordCount: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  keywordHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    marginRight: 4,
  },

  noticeList: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  noticeEmptyBox: {
    padding: 12,
    alignItems: 'center',
  },
  noticeEmptyText: {
    fontSize: 12,
    color: '#9ca3af',
  },

  noticeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  noticeIconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  noticeTextWrapper: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  noticeTitleRead: {
    color: '#9ca3af',
  },
  noticeMeta: {
    fontSize: 11,
    color: '#6b7280',
  },
  noticeRight: {
    marginLeft: 6,
  },
  unreadLabel: {
    fontSize: 10,
    color: PRIMARY,
    fontWeight: '700',
  },
  readLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
});
