import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

// ---------- Color map ----------
const COLORS = {
  Lambda: '#0077b6', EC2: '#00b4d8', EKS: '#f4a261', ECS: '#f7c59f',
  DynamoDB: '#0077b6', RDS: '#00b4d8', Aurora: '#f4a261', ElastiCache: '#f7c59f',
  ApiGateway: '#2a9d5c', CloudFront: '#8bd39a',
  SQS: '#0077b6', ALB: '#90e0ef', S3: '#f4a261',
  StepFunctions: '#90e0ef', OpenSearch: '#90e0ef',
  SNS: '#0077b6', Athena: '#90e0ef', SageMaker: '#f4a261',
};
const colorFor = (n) => COLORS[n] || '#5c6b8a';

// ---------- Distribution definitions (solo D6 y D12) ----------
const DISTRIBUTIONS = {
  v3_original: {
    label: 'V3 — Original',
    categories: [
      { key: 'compute', label: 'Dado_Compute', sides: 12, faces: [
        { n: 'Lambda', w: 6 }, { n: 'EC2', w: 4 }, { n: 'EKS', w: 1 }, { n: 'ECS', w: 1 }] },
      { key: 'database', label: 'Dado_Database', sides: 12, faces: [
        { n: 'DynamoDB', w: 4 }, { n: 'RDS', w: 2 }, { n: 'Aurora', w: 1 }, { n: 'ElastiCache', w: 1 }, { n: 'ApiGateway', w: 3 }, { n: 'CloudFront', w: 1 }] },
      { key: 'integration', label: 'Dado_Integration', sides: 6, faces: [
        { n: 'SQS', w: 1 }, { n: 'ALB', w: 1 }, { n: 'S3', w: 4 }] },
    ],
  },
  v3_mejorado: {
    label: 'V3 — Mejorado',
    categories: [
      { key: 'compute', label: 'Dado_Compute', sides: 12, faces: [
        { n: 'Lambda', w: 6 }, { n: 'EC2', w: 4 }, { n: 'EKS', w: 1 }, { n: 'ECS', w: 1 }] },
      { key: 'database', label: 'Dado_Database', sides: 12, faces: [
        { n: 'DynamoDB', w: 4 }, { n: 'RDS', w: 2 }, { n: 'Aurora', w: 1 }, { n: 'ElastiCache', w: 1 }, { n: 'ApiGateway', w: 3 }, { n: 'CloudFront', w: 1 }] },
      { key: 'storage', label: 'Dado_Storage', sides: 6, faces: [
        { n: 'S3', w: 4 }, { n: 'SQS', w: 1 }, { n: 'ALB', w: 1 }] },
    ],
  },
  centralidad_original: {
    label: 'Centralidad — Original',
    categories: [
      { key: 'compute', label: 'Dado_Compute', sides: 12, faces: [{ n: 'Lambda', w: 7 }, { n: 'EC2', w: 5 }] },
      { key: 'database', label: 'Dado_Database', sides: 6, faces: [{ n: 'DynamoDB', w: 4 }, { n: 'RDS', w: 2 }] },
      { key: 'networking', label: 'Dado_Networking_extra', sides: 6, faces: [{ n: 'ApiGateway', w: 6 }] },
      { key: 'puente1', label: 'Dado_Puente_1', sides: 12, faces: [{ n: 'EKS', w: 7 }, { n: 'StepFunctions', w: 5 }] },
      { key: 'puente2', label: 'Dado_Puente_2', sides: 6, faces: [{ n: 'SQS', w: 4 }, { n: 'OpenSearch', w: 2 }] },
      { key: 'storage', label: 'Dado_Storage', sides: 6, faces: [{ n: 'S3', w: 6 }] },
    ],
  },
  centralidad_cajon: {
    label: 'Centralidad — Cajón de sastre',
    categories: [
      { key: 'compute', label: 'Dado_Compute', sides: 12, faces: [{ n: 'Lambda', w: 7 }, { n: 'EC2', w: 5 }] },
      { key: 'database', label: 'Dado_Database', sides: 6, faces: [{ n: 'DynamoDB', w: 4 }, { n: 'RDS', w: 2 }] },
      { key: 'networking', label: 'Dado_Networking_extra', sides: 6, faces: [{ n: 'ApiGateway', w: 6 }] },
      { key: 'puente1', label: 'Dado_Puente_1', sides: 12, faces: [{ n: 'EKS', w: 7 }, { n: 'StepFunctions', w: 5 }] },
      { key: 'puente2', label: 'Dado_Puente_2', sides: 6, faces: [{ n: 'SQS', w: 4 }, { n: 'OpenSearch', w: 2 }] },
      { key: 'storage', label: 'Dado_Storage', sides: 6, faces: [{ n: 'S3', w: 6 }] },
      { key: 'wildcard', label: 'Dado_Wildcard_1', sides: 6, faces: [{ n: 'SNS', w: 2 }, { n: 'Athena', w: 2 }, { n: 'SageMaker', w: 2 }] },
    ],
  },
  variaciones_original: {
    label: 'Variaciones — Original',
    categories: [
      { key: 'd1', label: 'Dado_1', sides: 6, faces: [{ n: 'S3', w: 6 }] },
      { key: 'd2', label: 'Dado_2', sides: 6, faces: [{ n: 'Lambda', w: 5 }, { n: 'EKS', w: 1 }] },
      { key: 'd3', label: 'Dado_3', sides: 12, faces: [{ n: 'EC2', w: 5 }, { n: 'DynamoDB', w: 4 }, { n: 'RDS', w: 3 }] },
    ],
  },
};

// ---------- Helpers ----------
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function buildDeck(cat) {
  let deck = [];
  cat.faces.forEach((f) => { for (let i = 0; i < f.w; i++) deck.push(f.n); });
  return shuffle(deck);
}
function faceRanges(cat) {
  let from = 1;
  return cat.faces.map((f) => {
    const to = from + f.w - 1;
    const range = { ...f, from, to };
    from = to + 1;
    return range;
  });
}
function serviceForNumber(cat, num) {
  const ranges = faceRanges(cat);
  const hit = ranges.find((r) => num >= r.from && num <= r.to);
  return hit ? hit.n : ranges[ranges.length - 1].n;
}
function freshCatState(dist) {
  const state = {};
  dist.categories.forEach((cat) => {
    const fixed = cat.faces.length === 1;
    state[cat.key] = {
      mode: 'dado', deck: buildDeck(cat), deckPtr: 0,
      result: fixed ? cat.faces[0].n : null,
      rollFace: null, rolling: false, rollCount: fixed ? 1 : 0,
      fixed,
    };
  });
  return state;
}

// hexagon points for a 76x76 box (pointy-top), used to render D12 as a hexagon
const HEX_POINTS = '38,2 69,20 69,56 38,74 7,56 7,20';

export default function SimulatorScreen() {
  const router = useRouter();
  const [distKey, setDistKey] = useState('v3_original');
  const [catState, setCatState] = useState(() => freshCatState(DISTRIBUTIONS['v3_original']));
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  };

  const goBack = () => {
    if (router.canGoBack && router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const changeDistribution = (key) => {
    if (key === distKey) return;
    setDistKey(key);
    setCatState(freshCatState(DISTRIBUTIONS[key]));
    showToast('Distribución cambiada → ' + DISTRIBUTIONS[key].label);
  };

  const setMode = (catKey, mode) => {
    setCatState((prev) => ({ ...prev, [catKey]: { ...prev[catKey], mode } }));
  };

  const rollDie = (cat) => {
    setCatState((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], rolling: true, result: null } }));
    let ticks = 0;
    const maxTicks = 14;
    const interval = setInterval(() => {
      ticks++;
      const fakeFace = Math.floor(Math.random() * cat.sides) + 1;
      setCatState((prev) => ({ ...prev, [cat.key]: { ...prev[cat.key], rollFace: fakeFace } }));
      if (ticks >= maxTicks) {
        clearInterval(interval);
        const finalFace = Math.floor(Math.random() * cat.sides) + 1;
        const service = serviceForNumber(cat, finalFace);
        setCatState((prev) => ({
          ...prev,
          [cat.key]: { ...prev[cat.key], rollFace: finalFace, rolling: false },
        }));
        setTimeout(() => {
          setCatState((prev) => ({
            ...prev,
            [cat.key]: { ...prev[cat.key], result: service, rollCount: prev[cat.key].rollCount + 1 },
          }));
        }, 380);
      }
    }, 60);
  };

  const drawCard = (cat) => {
    setCatState((prev) => {
      const st = prev[cat.key];
      let deck = st.deck, ptr = st.deckPtr;
      if (ptr >= deck.length) {
        deck = buildDeck(cat);
        ptr = 0;
        showToast(cat.label + ' vacío → rebarajado automáticamente');
      }
      const card = deck[ptr];
      return { ...prev, [cat.key]: { ...st, deck, deckPtr: ptr + 1, result: card } };
    });
  };

  const resetCategory = (cat) => {
    setCatState((prev) => {
      const st = prev[cat.key];
      if (st.mode === 'dado') {
        if (st.fixed) return prev;
        return { ...prev, [cat.key]: { ...st, result: null, rollFace: null, rollCount: 0 } };
      }
      showToast(cat.label + ' rebarajado');
      return { ...prev, [cat.key]: { ...st, deck: buildDeck(cat), deckPtr: 0, result: null } };
    });
  };

  const resetAll = () => {
    setCatState(freshCatState(DISTRIBUTIONS[distKey]));
    showToast('Todo reiniciado');
  };

  const dist = DISTRIBUTIONS[distKey];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#060b18" />
      <View style={styles.header}>
        <Pressable onPress={goBack} hitSlop={10} style={styles.backLink}>
          <Text style={styles.backLinkText}>‹ volver</Text>
        </Pressable>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.brand}>AWS DICE</Text>
        </View>
      </View>

      <View style={styles.resetRow}>
        <Pressable style={styles.resetAllBtn} onPress={resetAll}>
          <Text style={styles.resetAllText}>↺ reiniciar todo</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {Object.entries(DISTRIBUTIONS).map(([key, d]) => (
          <Pressable
            key={key}
            style={[styles.chip, key === distKey && styles.chipActive]}
            onPress={() => changeDistribution(key)}
          >
            <Text style={[styles.chipText, key === distKey && styles.chipTextActive]}>{d.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {dist.categories.map((cat) => (
          <CategoryCard
            key={cat.key}
            cat={cat}
            state={catState[cat.key]}
            onSetMode={(mode) => setMode(cat.key, mode)}
            onRoll={() => rollDie(cat)}
            onDraw={() => drawCard(cat)}
            onReset={() => resetCategory(cat)}
          />
        ))}
      </ScrollView>

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}
    </SafeAreaView>
  );
}

function DieShape({ sides, rolling, rotate, face }) {
  const isHex = sides === 12;
  return (
    <Animated.View style={[styles.dieWrap, { transform: [{ rotate }, { scale: rolling ? 1.06 : 1 }] }]}>
      {isHex ? (
        <View style={styles.dieAbsoluteWrap}>
          <Svg width={76} height={76} viewBox="0 0 76 76">
            <Polygon points={HEX_POINTS} fill="#0a1220" stroke="#00b4d8" strokeWidth={2} />
          </Svg>
          <Text style={[styles.dieNumber, styles.dieNumberOverlay]}>{face}</Text>
        </View>
      ) : (
        <View style={styles.dieFaceSquare}>
          <Text style={styles.dieNumber}>{face}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function CategoryCard({ cat, state, onSetMode, onRoll, onDraw, onReset }) {
  const spin = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);
  const ranges = faceRanges(cat);

  useEffect(() => {
    if (state.rolling) {
      spin.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: true })
      );
      loopRef.current.start();
    } else {
      if (loopRef.current) { loopRef.current.stop(); loopRef.current = null; }
      Animated.timing(spin, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, [state.rolling]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const remaining = state.deck.length - state.deckPtr;
  const pct = Math.round((remaining / state.deck.length) * 100);
  const fixedDado = state.fixed && state.mode === 'dado';

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{cat.label}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>D{cat.sides}</Text></View>
      </View>

      <View style={styles.modeToggle}>
        <Pressable
          style={[styles.modeBtn, state.mode === 'dado' && styles.modeBtnActive]}
          onPress={() => onSetMode('dado')}
        >
          <Text style={[styles.modeBtnText, state.mode === 'dado' && { color: '#00b4d8' }]}>🎲 dado</Text>
        </Pressable>
        <Pressable
          style={[styles.modeBtn, state.mode === 'mazo' && styles.modeBtnActive]}
          onPress={() => onSetMode('mazo')}
        >
          <Text style={[styles.modeBtnText, state.mode === 'mazo' && { color: '#c2318f' }]}>🂠 mazo</Text>
        </Pressable>
      </View>

      <View style={[styles.stage, state.mode === 'dado' && !fixedDado && { minHeight: 156 }]}>
        {fixedDado ? (
          <>
            <Text style={[styles.resultName, { color: colorFor(state.result) }]}>{state.result}</Text>
            <Text style={styles.resultSub}>único resultado posible (todas las caras)</Text>
          </>
        ) : state.mode === 'dado' ? (
          state.rollFace != null ? (
            <>
              <DieShape sides={cat.sides} rolling={state.rolling} rotate={rotate} face={state.rollFace} />
              {!state.rolling && state.result ? (
                <>
                  <Text style={[styles.resultName, { color: colorFor(state.result) }]}>{state.result}</Text>
                  <Text style={styles.resultSub}>tirada #{state.rollCount}</Text>
                </>
              ) : (
                <Text style={styles.resultSub}>{state.rolling ? 'rodando…' : ''}</Text>
              )}
            </>
          ) : (
            <Text style={styles.resultPlaceholder}>sin tirar aún</Text>
          )
        ) : state.result ? (
          <>
            <Text style={[styles.resultName, { color: colorFor(state.result) }]}>{state.result}</Text>
            <Text style={styles.resultSub}>carta sacada</Text>
          </>
        ) : (
          <Text style={styles.resultPlaceholder}>sin sacar aún</Text>
        )}
      </View>

      {!fixedDado && (
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.mainBtn, state.mode === 'mazo' && { backgroundColor: '#c2318f' }]}
            disabled={state.rolling}
            onPress={state.mode === 'dado' ? onRoll : onDraw}
          >
            <Text style={styles.mainBtnText}>{state.mode === 'dado' ? 'LANZAR DADO' : 'SACAR CARTA'}</Text>
          </Pressable>
          <Pressable style={styles.ghostBtn} onPress={onReset}>
            <Text style={styles.ghostBtnText}>↺</Text>
          </Pressable>
        </View>
      )}

      {state.mode === 'mazo' && (
        <View style={styles.deckStatusRow}>
          <Text style={styles.deckStatusText}>{remaining} / {state.deck.length}</Text>
          <View style={styles.deckBar}>
            <View style={[styles.deckBarFill, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.deckStatusText}>restantes</Text>
        </View>
      )}

      <View style={styles.weightsBar}>
        {cat.faces.map((f, i) => (
          <View key={i} style={{ flex: f.w, height: '100%', backgroundColor: colorFor(f.n) }} />
        ))}
      </View>
      <View style={styles.legendRow}>
        {ranges.map((f, i) => (
          <View key={i} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colorFor(f.n) }]} />
            <Text style={styles.legendText}>
              {f.n} ({f.from === f.to ? f.from : `${f.from}–${f.to}`})
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#060b18' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 16 : 4, paddingBottom: 6,
  },
  backLink: { paddingVertical: 4, paddingRight: 10 },
  backLinkText: { color: '#8b93a7', fontSize: 13 },
  brand: { color: '#eef2f9', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  resetRow: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 10, marginBottom: 6,
  },
  resetAllBtn: { borderWidth: 1, borderColor: '#233257', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  resetAllText: { color: '#8b93a7', fontSize: 11 },
  chipRow: { flexGrow: 0, marginBottom: 10 },
  chip: {
    borderWidth: 1, borderColor: '#233257', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14,
    marginRight: 8, backgroundColor: '#101a33',
  },
  chipActive: { borderColor: '#0077b6', backgroundColor: 'rgba(0,180,216,0.10)' },
  chipText: { color: '#8b93a7', fontSize: 12.5, fontWeight: '600' },
  chipTextActive: { color: '#90e0ef' },
  body: { flex: 1 },
  card: {
    backgroundColor: '#101a33', borderWidth: 1, borderColor: '#233257', borderRadius: 14,
    padding: 16, marginBottom: 14,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { color: '#eef2f9', fontSize: 15, fontWeight: '600' },
  badge: { borderWidth: 1, borderColor: '#0077b6', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 9 },
  badgeText: { color: '#90e0ef', fontSize: 11 },
  modeToggle: {
    flexDirection: 'row', backgroundColor: '#0c1428', borderWidth: 1, borderColor: '#233257',
    borderRadius: 999, padding: 3, marginBottom: 12,
  },
  modeBtn: { flex: 1, paddingVertical: 7, borderRadius: 999, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#16213f' },
  modeBtnText: { color: '#8b93a7', fontSize: 11.5 },
  stage: {
    backgroundColor: '#0c1428', borderWidth: 1, borderColor: '#233257', borderRadius: 10,
    minHeight: 88, alignItems: 'center', justifyContent: 'center', marginBottom: 12, padding: 12, gap: 6,
  },
  dieWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dieAbsoluteWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  dieFaceSquare: {
    width: 68, height: 68, borderRadius: 16, borderWidth: 2, borderColor: '#00b4d8',
    backgroundColor: '#0a1220', alignItems: 'center', justifyContent: 'center',
  },
  dieNumber: { color: '#90e0ef', fontSize: 26, fontWeight: '800' },
  dieNumberOverlay: { position: 'absolute' },
  resultName: { fontSize: 19, fontWeight: '700' },
  resultSub: { color: '#525d78', fontSize: 11 },
  resultPlaceholder: { color: '#525d78', fontSize: 13 },
  actionsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  mainBtn: { flex: 1, backgroundColor: '#00b4d8', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  mainBtnText: { color: '#032230', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  ghostBtn: { width: 42, borderWidth: 1, borderColor: '#233257', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText: { color: '#8b93a7', fontSize: 16 },
  deckStatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  deckStatusText: { color: '#8b93a7', fontSize: 10.5 },
  deckBar: { flex: 1, height: 5, backgroundColor: '#0c1428', borderRadius: 3, marginHorizontal: 8, overflow: 'hidden' },
  deckBarFill: { height: '100%', backgroundColor: '#c2318f' },
  weightsBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#233257', marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 2, marginRight: 4 },
  legendText: { color: '#525d78', fontSize: 10.5 },
  toast: {
    position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: '#16213f',
    borderWidth: 1, borderColor: '#0077b6', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18,
  },
  toastText: { color: '#eef2f9', fontSize: 12 },
});