import { Modal, View, StyleSheet, Pressable } from 'react-native';
import AppText from '../AppText';

export default function ConfirmModal({ visible, title = '확인', message, onCancel, onConfirm }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <AppText style={styles.title}>{title}</AppText>
          {!!message && <AppText style={styles.msg}>{message}</AppText>}
          <View style={styles.row}>
            <Pressable style={[styles.btn, styles.cancel]} onPress={onCancel}>
              <AppText>취소</AppText>
            </Pressable>
            <Pressable style={[styles.btn, styles.danger]} onPress={onConfirm}>
              <AppText style={{ color: '#fff' }}>삭제</AppText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ConfirmModal.js 파일 맨 아래에 추가
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', // 반투명 검은 배경
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  msg: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancel: {
    backgroundColor: '#f0f0f0',
  },
  danger: {
    backgroundColor: '#E5484D',
  },
});
