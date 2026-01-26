import { Pressable, Text, StyleSheet } from 'react-native';

export default function ButtonPrimary({ title, onPress, style }) {
  return (
    <Pressable 
        onPress={onPress} 
        style={({ pressed }) => [
            styles.btn, 
            pressed && { opacity: 0.7 }, 
            style 
        ]}
    >
      <Text style={styles.txt}>{title}</Text>
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