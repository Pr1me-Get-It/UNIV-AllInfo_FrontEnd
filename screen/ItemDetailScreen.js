import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
// 기존 UI 컴포넌트 유지
import ButtonPrimary from '../components/ui/ButtonPrimary';
import ConfirmModal from '../components/ui/ConfirmModal';
// API 함수 import
import { getItem, deleteItem } from "../api/items";

export default function ItemDetailScreen({ route, navigation }) {
  const { id } = route.params;
  
  // 1. State 관리
  const [item, setItem] = useState(null);
  const [showDel, setShowDel] = useState(false); // 모달 표시 여부

  // 2. 데이터 로딩 로직 (API 호출)
  const load = useCallback(async () => {
    try {
      const data = await getItem(id);
      setItem(data);
    } catch (e) {
      Alert.alert("오류", e.message);
    }
  }, [id]);

  // 3. 화면 포커스 시 데이터 갱신 (수정 후 돌아왔을 때 반영됨)
  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, load]);

  // 4. 삭제 로직 (API 호출)
  const handleDelete = async () => {
    try {
      await deleteItem(item.id);
      setShowDel(false); // 모달 닫기
      
      // 삭제 성공 후 알림 및 뒤로가기
      Alert.alert("완료", "삭제되었습니다.", [
        { 
            text: "확인", 
            // 텍스트 코드는 navigate('List')였으나, 스택 네비게이션 구조상 
            // goBack()이 더 자연스러워 변경했습니다. (목록 화면이 자동으로 갱신됨)
            onPress: () => navigation.goBack() 
        }
      ]);
    } catch (e) {
      Alert.alert("실패", e.message);
      setShowDel(false);
    }
  };

  // 로딩 중 화면 처리
  if (!item) {
    return (
        <View style={styles.page}>
            <Text>정보를 불러오는 중...</Text>
        </View>
    );
  }

  return (
    <View style={styles.page}>
      {/* 상세 정보 표시 (기존 UI 스타일 적용) */}
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.price}>
        {Number(item.price).toLocaleString()}원
      </Text>

      <View style={{ height: 16 }} />

      {/* 수정 버튼 */}
      <ButtonPrimary
        title="수정하기"
        onPress={() => navigation.navigate('Edit', { id: item.id })}
      />
      
      <View style={{ height: 8 }} />
      
      {/* 삭제 버튼 (누르면 모달 오픈) */}
      <ButtonPrimary 
        title="삭제하기" 
        onPress={() => setShowDel(true)} 
        style={{ backgroundColor: '#E5484D' }} 
      />

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        visible={showDel}
        message="정말 삭제할까요?"
        onCancel={() => setShowDel(false)}
        onConfirm={handleDelete} // 여기서 API 삭제 함수 호출
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  desc: {
    fontSize: 16,
    color: '#555',
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2f5fd3',
  },
});