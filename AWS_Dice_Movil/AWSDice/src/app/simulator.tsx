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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const minDim = Math.min(width, height);
const orbitRadius = Math.min(minDim * 0.28, 140);
const boardHeight = orbitRadius * 2 + 250;

const COLORS = {
  Lambda: '#0077b6', EC2: '#00b4d8', EKS: '#f4a261', ECS: '#f7c59f',
  DynamoDB: '#0077b6', RDS: '#00b4d8', Aurora: '#f4a261', ElastiCache: '#f7c59f',
  ApiGateway: '#2a9d5c', CloudFront: '#8bd39a', CloudWatch: '#2a9d5c',
  SQS: '#0077b6', ALB: '#90e0ef', S3: '#f4a261',
  StepFunctions: '#90e0ef', OpenSearch: '#90e0ef',
  SNS: '#0077b6', Athena: '#90e0ef', SageMaker: '#f4a261',
};
const colorFor = (n) => COLORS[n] || '#5c6b8a';

const DISTRIBUTIONS = {
  v4_centralidad_toxicos: {
    label: 'V4 — Centralidad',
    categories: [
      { key: 'compute', label: 'Dado_Compute', sides: 12, faces: [
        { n: 'Lambda', w: 6 }, { n: 'EC2', w: 4 }, { n: 'EKS', w: 1 }, { n: 'ECS', w: 1 }] },
      { key: 'database', label: 'Dado_Database', sides: 6, faces: [
        { n: 'DynamoDB', w: 3 }, { n: 'RDS', w: 2 }, { n: 'ElastiCache', w: 1 }] },
      { key: 'integration', label: 'Dado_Integration', sides: 6, faces: [
        { n: 'SQS', w: 4 }, { n: 'CloudWatch', w: 2 }] },
      { key: 'networking', label: 'Dado_Networking', sides: 12, faces: [
        { n: 'ApiGateway', w: 7 }, { n: 'CloudFront', w: 3 }, { n: 'ALB', w: 2 }] },
      { key: 'storage', label: 'Dado_Storage', sides: 1, faces: [
        { n: 'S3', w: 1 }] },
    ],
  },
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
      { key: 'storage', label: 'Dado_Storage', sides: 1, faces: [{ n: 'S3', w: 1 }] },
    ],
  },
};

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

const HEX_POINTS = '38,2 69,20 69,56 38,74 7,56 7,20';
const USE_NATIVE = Platform.OS !== 'web'; // Previene que el navegador mate las animaciones

export default function SimulatorScreen() {
  const router = useRouter();
  const [distKey, setDistKey] = useState('v4_centralidad_toxicos');
  const [catState, setCatState] = useState(() => freshCatState(DISTRIBUTIONS['v4_centralidad_toxicos']));
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  const orbitAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    orbitAnim.setValue(0);
    Animated.loop(
      Animated.timing(orbitAnim, {
        toValue: 1,
        duration: 40000,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE
      }),
      { iterations: -1 }
    ).start();
  }, [orbitAnim]);

  const orbitRotate = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const counterRotate = orbitAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

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
            [cat.key]: { ...prev[cat.key], result: service, rollCount: (prev[cat.key]?.rollCount || 0) + 1 },
          }));
        }, 380);
      }
    }, 60);
  };

  const rollAll = () => {
    const dist = DISTRIBUTIONS[distKey];
    dist.categories.forEach((cat) => {
      setCatState((prev) => {
        const state = prev[cat.key];
        if (state.mode === 'dado' && !state.fixed && !state.rolling) {
          setTimeout(() => rollDie(cat), 0);
        }
        return prev;
      });
    });
    showToast('¡Lanzando todos los dados!');
  };

  const drawCard = (cat) => {
    setCatState((prev) => {
      const st = prev[cat.key];
      let deck = st.deck || buildDeck(cat);
      let ptr = st.deckPtr || 0;
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
        <Text style={styles.brand}>AWS DICE</Text>
      </View>

      <View style={styles.resetRow}>
        <Pressable style={styles.rollAllBtn} onPress={rollAll}>
          <Text style={styles.rollAllText}>🎲 LANZAR TODOS</Text>
        </Pressable>
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

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Órbita Principal con Altura Dinámica controlada */}
        <Pressable style={[styles.boardArea, { height: boardHeight }]} onPress={rollAll}>
          <Animated.View style={[styles.circleContainer, { transform: [{ rotate: orbitRotate }] }]}>
            {dist.categories.map((cat, i) => {
              const total = dist.categories.length;
              const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
              const x = orbitRadius * Math.cos(angle);
              const y = orbitRadius * Math.sin(angle);

              return (
                <Animated.View
                  key={cat.key}
                  style={[
                    styles.orbitItem,
                    {
                      transform: [
                        { translateX: x },
                        { translateY: y },
                        { rotate: counterRotate }
                      ]
                    }
                  ]}
                >
                  <DieOnBoard cat={cat} state={catState[cat.key]} />
                </Animated.View>
              );
            })}
          </Animated.View>
          <Text style={styles.instructionText}>Toca aquí para lanzar todos a la vez</Text>
        </Pressable>

        {/* Sección de Cajones / Tarjetas */}
        <View style={styles.cardsContainer}>
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
        </View>

      </ScrollView>

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}
    </SafeAreaView>
  );
}

function DieShape({ sides, rolling, rotate, face, floatX, floatY, fixed }) {
  const isHex = sides === 12;
  const displayFace = fixed ? '0' : face;

  return (
    <Animated.View style={[
      styles.dieWrap,
      {
        transform: [
          { translateX: floatX },
          { translateY: floatY },
          { rotate },
          { scale: rolling ? 1.06 : 1 }
        ]
      }
    ]}>
      {fixed ? (
        <View style={styles.dieFaceCircle}>
          <Text style={styles.dieNumber}>{displayFace}</Text>
        </View>
      ) : isHex ? (
        <View style={styles.dieAbsoluteWrap}>
          <Svg width={76} height={76} viewBox="0 0 76 76">
            <Polygon points={HEX_POINTS} fill="#0a1220" stroke="#00b4d8" strokeWidth={2} />
          </Svg>
          <Text style={[styles.dieNumber, styles.dieNumberOverlay]}>{displayFace}</Text>
        </View>
      ) : (
        <View style={styles.dieFaceSquare}>
          <Text style={styles.dieNumber}>{displayFace}</Text>
        </View>
      )}
    </Animated.View>
  );
}

function DieOnBoard({ cat, state }) {
  const spin = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    floatAnim.setValue(0);
    Animated.loop(
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 2500 + Math.random() * 1500,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE
      }),
      { iterations: -1 }
    ).start();
  }, [floatAnim]);

  useEffect(() => {
    if (state.rolling && !state.fixed) {
      spin.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: USE_NATIVE }),
        { iterations: -1 }
      );
      loopRef.current.start();
    } else {
      if (loopRef.current) { loopRef.current.stop(); loopRef.current = null; }
      Animated.timing(spin, { toValue: 0, duration: 150, useNativeDriver: USE_NATIVE }).start();
    }
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, [state.rolling, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const floatX = floatAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 4, 0, -4, 0]
  });
  const floatY = floatAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-4, 0, 4, 0, -4]
  });

  const displayFace = state.fixed ? '0' : (state.rollFace === null ? '?' : state.rollFace);

  return (
    <View style={styles.dieItemContainer}>
      <Text style={styles.dieCategoryLabel}>{cat.label}</Text>
      <DieShape
        sides={cat.sides}
        rolling={state.rolling && !state.fixed}
        rotate={rotate}
        face={displayFace}
        floatX={floatX}
        floatY={floatY}
        fixed={state.fixed}
      />
      <View style={styles.resultContainer}>
        {state.result && (!state.rolling || state.fixed) ? (
          <Text style={[styles.resultText, { color: colorFor(state.result) }]}>{state.result}</Text>
        ) : (
          <Text style={styles.resultPlaceholder}>---</Text>
        )}
      </View>
    </View>
  );
}

function CategoryCard({ cat, state, onSetMode, onRoll, onDraw, onReset }) {
  const spin = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);
  const ranges = faceRanges(cat);

  useEffect(() => {
    floatAnim.setValue(0);
    Animated.loop(
      Animated.timing(floatAnim, {
        toValue: 1,
        duration: 3000 + Math.random() * 1000,
        easing: Easing.linear,
        useNativeDriver: USE_NATIVE
      }),
      { iterations: -1 }
    ).start();
  }, [floatAnim]);

  useEffect(() => {
    if (state.rolling && !state.fixed) {
      spin.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: USE_NATIVE }),
        { iterations: -1 }
      );
      loopRef.current.start();
    } else {
      if (loopRef.current) { loopRef.current.stop(); loopRef.current = null; }
      Animated.timing(spin, { toValue: 0, duration: 150, useNativeDriver: USE_NATIVE }).start();
    }
    return () => { if (loopRef.current) loopRef.current.stop(); };
  }, [state.rolling, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const floatX = floatAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, 6, 0, -6, 0]
  });
  const floatY = floatAnim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-6, 0, 6, 0, -6]
  });

  const deckLength = state?.deck?.length || 1;
  const remaining = state?.deck ? deckLength - (state?.deckPtr || 0) : 0;
  const pct = Math.round((remaining / deckLength) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{cat.label}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{state.fixed ? 'Fijo' : `D${cat.sides}`}</Text></View>
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

      <View style={[styles.stage, state.mode === 'dado' && { minHeight: 156 }]}>
        {state.mode === 'dado' ? (
          (state.rollFace != null || state.fixed) ? (
            <>
              <DieShape
                sides={cat.sides}
                rolling={state.rolling}
                rotate={rotate}
                face={state.rollFace}
                floatX={floatX}
                floatY={floatY}
                fixed={state.fixed}
              />
              {(!state.rolling && state.result) || state.fixed ? (
                <>
                  <Text style={[styles.resultName, { color: colorFor(state.result) }]}>{state.result}</Text>
                  <Text style={styles.resultSub}>{state.fixed ? 'único resultado posible' : `tirada #${state.rollCount || 1}`}</Text>
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

      {!state.fixed && (
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
          <Text style={styles.deckStatusText}>{remaining} / {deckLength}</Text>
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
              {f.n} {state.fixed ? '' : `(${f.from === f.to ? f.from : `${f.from}–${f.to}`})`}
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 16 : 4, paddingBottom: 6,
  },
  backLink: { paddingVertical: 4, paddingRight: 10 },
  backLinkText: { color: '#8b93a7', fontSize: 13 },
  brand: { color: '#eef2f9', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
  resetRow: {
    flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, marginTop: 4, marginBottom: 12,
  },
  resetAllBtn: { borderWidth: 1, borderColor: '#233257', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  resetAllText: { color: '#8b93a7', fontSize: 11 },
  rollAllBtn: { backgroundColor: '#0077b6', borderRadius: 999, paddingVertical: 7, paddingHorizontal: 14 },
  rollAllText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  chipRow: { flexGrow: 0, minHeight: 40, marginBottom: 16 },
  chip: {
    borderWidth: 1, borderColor: '#233257', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 14,
    marginRight: 8, backgroundColor: '#101a33', alignSelf: 'flex-start'
  },
  chipActive: { borderColor: '#0077b6', backgroundColor: 'rgba(0,180,216,0.10)' },
  chipText: { color: '#8b93a7', fontSize: 12.5, fontWeight: '600' },
  chipTextActive: { color: '#90e0ef' },

  body: { flex: 1 },

  // --- ORBIT STYLES ---
  boardArea: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0c1428',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#233257',
    overflow: 'hidden',
  },
  circleContainer: {
    width: 0,
    height: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitItem: {
    position: 'absolute',
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dieItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dieCategoryLabel: {
    color: '#8b93a7',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultContainer: {
    marginTop: 10,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  instructionText: {
    position: 'absolute',
    bottom: 20,
    color: '#525d78',
    fontSize: 12,
  },

  // --- CARDS STYLES ---
  cardsContainer: {
    paddingHorizontal: 16,
  },
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

  // --- DICE SHAPES ---
  dieWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  dieAbsoluteWrap: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  dieFaceSquare: {
    width: 68, height: 68, borderRadius: 16, borderWidth: 2, borderColor: '#00b4d8',
    backgroundColor: '#0a1220', alignItems: 'center', justifyContent: 'center',
  },
  dieFaceCircle: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#00b4d8',
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
    position: 'absolute', bottom: 40, alignSelf: 'center', backgroundColor: '#16213f',
    borderWidth: 1, borderColor: '#0077b6', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18,
  },
  toastText: { color: '#eef2f9', fontSize: 12 },
});