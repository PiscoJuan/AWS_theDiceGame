import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.eyebrow}>SIMULADOR</Text>
        <Text style={styles.title}>AWS DICE</Text>
        <Text style={styles.subtitle}>dados & mazos ponderados de servicios AWS</Text>

        <Link href="/simulator" asChild>
          <Pressable style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}>
            <Text style={styles.bigButtonText}>🎲  ENTRAR AL SIMULADOR</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060b18' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  eyebrow: {
    color: '#0077b6', fontSize: 12, letterSpacing: 3, fontWeight: '700', marginBottom: 10,
  },
  title: {
    color: '#eef2f9', fontSize: 42, fontWeight: '800', letterSpacing: 1, marginBottom: 10,
  },
  subtitle: {
    color: '#8b93a7', fontSize: 13, textAlign: 'center', marginBottom: 40, maxWidth: 280,
  },
  bigButton: {
    backgroundColor: '#00b4d8',
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 999,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#00b4d8',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  bigButtonPressed: { opacity: 0.85 },
  bigButtonText: {
    color: '#032230', fontSize: 15, fontWeight: '800', letterSpacing: 0.6,
  },
});