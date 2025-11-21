import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text } from 'react-native';
import ItemForm from '../components/items/ItemForm';
import { getItem, updateItem } from '../api/items';

export default function ItemEditScreen({ route, navigation }) {
  const { id } = route.params;
  const [originItem, setOriginItem] = useState(null); // 초기 데이터를 담을 State

  // 1. 데이터 로드 (useEffect)
  // 기존 Context는 동기적이었으나, API는 비동기이므로 로딩 과정이 필요합니다.
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getItem(id);
        setOriginItem(data);
      } catch (e) {
        Alert.alert("오류", e.message);
        navigation.goBack(); // 데이터 로드 실패 시 뒤로가기
      }
    };
    loadData();
  }, [id, navigation]);

  // 2. 저장 핸들러 (API 호출)
  const handleSubmit = async (form) => {
    // 유효성 검사 (텍스트 코드 로직 적용)
    if (!form.name || !form.name.trim()) {
        return Alert.alert("알림", "이름을 입력하세요.");
    }

    try {
      // API 업데이트 호출
      // ItemForm에서 받은 객체를 API 포맷에 맞춰 전송
      await updateItem(id, {
        name: form.name.trim(),
        description: form.description ? form.description.trim() : "",
        price: Number(form.price),
      });

      Alert.alert("성공", "수정되었습니다.", [
        { text: "확인", onPress: () => navigation.goBack() }
      ]);
    } catch (e) {
      Alert.alert("실패", e.message);
    }
  };

  // 3. 로딩 중 처리
  // 데이터를 받아오기 전에는 Form을 그릴 수 없으므로 로딩 텍스트 표시
  if (!originItem) {
    return (
      <View style={[styles.page, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>정보를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <ItemForm
        initial={originItem} // API에서 받아온 데이터를 초기값으로 설정
        onSubmit={handleSubmit}
        onCancel={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
});