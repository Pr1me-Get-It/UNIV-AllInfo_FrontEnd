import { Pressable, StyleSheet } from 'react-native';
import AppText from '../AppText';

export default function ButtonPrimary({ title, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }, style]}>
      <AppText style={styles.txt}>{title}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: 'rgb(219, 31, 38)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
