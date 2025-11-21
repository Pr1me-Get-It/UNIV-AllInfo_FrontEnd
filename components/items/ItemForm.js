import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import ButtonPrimary from '../ui/ButtonPrimary';

export default function ItemForm({ initial = {}, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: initial.name ?? '',
    description: initial.description ?? '',
    price: initial.price != null ? String(initial.price) : '',
  });

  const update = (k, v) => setForm((prev) => ({ ...prev, [k]: k === 'price' ? v.replace(/[^0-9]/g, '') : v }));

  return (
    <View style={styles.wrap}>
      <View>
        <Text style={styles.label}>이름</Text>
        <TextInput style={styles.input} placeholder="예) 무지 티셔츠" value={form.name} onChangeText={(t)=>update('name', t)} />
      </View>
      <View>
        <Text style={styles.label}>설명</Text>
        <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          multiline
          placeholder="간단 설명"
          value={form.description}
          onChangeText={(t)=>update('description', t)}
        />
      </View>
      <View>
        <Text style={styles.label}>가격</Text>
        <TextInput style={styles.input}
          keyboardType="numeric"
          placeholder="0"
          value={form.price}
          onChangeText={(t)=>update('price', t)}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <ButtonPrimary title="저장" onPress={() => onSubmit?.({
          name: form.name.trim(),
          description: form.description.trim(),
          price: Number(form.price || 0),
        })} />
        <ButtonPrimary title="취소" onPress={onCancel} style={{ backgroundColor: '#444' }} />
      </View>
    </View>
  );
}

// ItemForm.js 파일 맨 아래에 추가
const styles = StyleSheet.create({
  wrap: {
    padding: 20,
    gap: 20, // 입력창 사이 간격
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
});