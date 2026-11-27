import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { useTheme } from "../theme/theme-provider";

const LETTERS = "TrafficSense".split("");

type LogoAnimationProps = {
  exiting?: boolean;
  onExitComplete?: () => void;
};

export function LogoAnimation({ exiting = false, onExitComplete }: LogoAnimationProps) {
  const { colors, isDark, reduceMotion } = useTheme();

  const [tileAnim] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [hillLAnim] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [hillRAnim] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [pinDropAnim] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [ripple1Anim] = useState(() => new Animated.Value(0));
  const [ripple2Anim] = useState(() => new Animated.Value(0));
  const [hopAnim] = useState(() => new Animated.Value(0));
  const [taglineAnim] = useState(() => new Animated.Value(reduceMotion ? 1 : 0));
  const [exitAnim] = useState(() => new Animated.Value(0));
  const [letterAnims] = useState(() =>
    LETTERS.map(() => new Animated.Value(reduceMotion ? 1 : 0)),
  );

  useEffect(() => {
    if (reduceMotion) return;

    Animated.timing(tileAnim, {
      toValue: 1,
      duration: 900,
      easing: Easing.bezier(0.34, 1.4, 0.64, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(hillLAnim, {
      toValue: 1,
      delay: 220,
      duration: 700,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(hillRAnim, {
      toValue: 1,
      delay: 280,
      duration: 700,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(pinDropAnim, {
      toValue: 1,
      delay: 900,
      duration: 720,
      easing: Easing.out(Easing.bounce),
      useNativeDriver: true,
    }).start();

    Animated.timing(ripple1Anim, {
      toValue: 1,
      delay: 1224,
      duration: 900,
      easing: Easing.bezier(0, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();

    Animated.timing(ripple2Anim, {
      toValue: 1,
      delay: 1404,
      duration: 900,
      easing: Easing.bezier(0, 0, 0.2, 1),
      useNativeDriver: true,
    }).start();

    Animated.stagger(
      30,
      letterAnims.map((anim, idx) =>
        Animated.timing(anim, {
          toValue: 1,
          delay: idx === 0 ? 1250 : 0,
          duration: 560,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
      ),
    ).start();

    Animated.timing(taglineAnim, {
      toValue: 1,
      delay: 1750,
      duration: 900,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    }).start();

    const hopTimer = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(hopAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
          Animated.timing(hopAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.bezier(0.45, 0, 0.55, 1),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }, 2500);

    return () => clearTimeout(hopTimer);
  }, [
    reduceMotion,
    tileAnim,
    hillLAnim,
    hillRAnim,
    pinDropAnim,
    ripple1Anim,
    ripple2Anim,
    letterAnims,
    taglineAnim,
    hopAnim,
  ]);

  useEffect(() => {
    if (!exiting) return;
    if (reduceMotion) {
      Animated.timing(exitAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start(() => onExitComplete?.());
      return;
    }
    Animated.timing(exitAnim, {
      toValue: 1,
      duration: 640,
      easing: Easing.bezier(0.7, 0, 0.84, 0),
      useNativeDriver: true,
    }).start(() => onExitComplete?.());
  }, [exiting, exitAnim, onExitComplete, reduceMotion]);

  const tileTranslateY = tileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });
  const tileScale = tileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 1],
  });
  const tileRotate = tileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-8deg", "0deg"],
  });

  const pinTranslateY = pinDropAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-74, 0],
  });
  const hopTranslateY = hopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -14],
  });

  const exitZoom = exitAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1 : 9],
  });
  const exitOpacity = exitAnim.interpolate({
    inputRange: [0, 0.85, 1],
    outputRange: [1, 1, 0],
  });
  const textFadeOut = exitAnim.interpolate({
    inputRange: [0, 0.25, 1],
    outputRange: [1, 0, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.background, opacity: exitOpacity },
      ]}
    >
      <Animated.View
        style={[
          styles.tileShadowWrap,
          {
            opacity: tileAnim,
            transform: [
              { translateY: tileTranslateY },
              { scale: Animated.multiply(tileScale, exitZoom) },
              { rotate: tileRotate },
            ],
            shadowColor: "#101820",
            shadowOpacity: isDark ? 0.6 : 0.14,
            shadowRadius: 32,
            shadowOffset: { width: 0, height: 12 },
            elevation: 10,
          },
        ]}
      >
        <View style={styles.tileClip}>
          <Svg width={136} height={136} viewBox="0 0 120 120">
            <Defs>
              <ClipPath id="lgClip">
                <Rect width="120" height="120" rx="28" />
              </ClipPath>
              <LinearGradient id="lgSky" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#36AEF6" />
                <Stop offset="1" stopColor="#0A63D6" />
              </LinearGradient>
              <LinearGradient id="lgGrass" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#3FD46F" />
                <Stop offset="1" stopColor="#0C9C86" />
              </LinearGradient>
              <LinearGradient id="lgPin" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#FF6B3D" />
                <Stop offset="1" stopColor="#E5173F" />
              </LinearGradient>
            </Defs>
            <G clipPath="url(#lgClip)">
              <Rect width="120" height="120" fill="url(#lgSky)" />
              <Path
                d="M120 26C96 34 80 56 88 84C92 100 104 112 120 118Z"
                fill="#9AD8FB"
              />
              <Path
                d="M0 30C24 38 38 62 28 90C24 104 26 114 30 124H0Z"
                fill="url(#lgGrass)"
              />
              <Path
                d="M62 126C58 98 30 90 34 66C38 46 62 40 78 14"
                stroke="#FFFFFF"
                strokeWidth="27"
                fill="none"
              />
              <Path
                d="M62 126C58 98 30 90 34 66C38 46 62 40 78 14"
                stroke="#141C2B"
                strokeWidth="20"
                fill="none"
              />
              <Path
                d="M62 126C58 98 30 90 34 66C38 46 62 40 78 14"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeDasharray="5 6"
                strokeLinecap="round"
                fill="none"
              />
              <Ellipse cx="91" cy="63" rx="6" ry="1.8" fill="#000000" opacity={0.28} />
            </G>
          </Svg>

          {/* Animated Pin Overlay */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pinOverlay,
              {
                opacity: pinDropAnim,
                transform: [
                  { translateY: pinTranslateY },
                  { translateY: hopTranslateY },
                ],
              },
            ]}
          >
            <Svg width={136} height={136} viewBox="0 0 120 120">
              <Defs>
                <LinearGradient id="lgPinOverlay" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#FF6B3D" />
                  <Stop offset="1" stopColor="#E5173F" />
                </LinearGradient>
              </Defs>
              <Path
                d="M91 63C88 58 78 51 78 42A13 13 0 1 1 104 42C104 51 94 58 91 63Z"
                fill="url(#lgPinOverlay)"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <Path
                d="M91 47.2a5.2 5.2 0 1 0 0-10.4 5.2 5.2 0 0 0 0 10.4z"
                fill="#FFFFFF"
              />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Wordmark */}
      <Animated.View style={[styles.wordmarkRow, { opacity: textFadeOut }]}>
        {LETTERS.map((ch, idx) => {
          const anim = letterAnims[idx];
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [18, 0],
          });
          return (
            <Animated.Text
              key={`${ch}-${idx}`}
              style={[
                styles.wordmarkLetter,
                {
                  color: idx > 6 ? colors.brandBlue : colors.text,
                  opacity: anim,
                  transform: [{ translateY }],
                },
              ]}
            >
              {ch}
            </Animated.Text>
          );
        })}
      </Animated.View>

      {/* Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            color: colors.text3,
            opacity: Animated.multiply(taglineAnim, textFadeOut),
          },
        ]}
      >
        SAFER ROADS · SMARTER COMMUTES
      </Animated.Text>

      {/* Bottom City Label */}
      <Animated.Text
        style={[
          styles.cityLabel,
          {
            color: colors.text3,
            opacity: Animated.multiply(taglineAnim, textFadeOut),
          },
        ]}
      >
        Mangaluru
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 200,
  },
  tileShadowWrap: {
    width: 136,
    height: 136,
    borderRadius: 32,
  },
  tileClip: {
    width: 136,
    height: 136,
    borderRadius: 32,
    overflow: "hidden",
  },
  pinOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wordmarkRow: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  wordmarkLetter: {
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -0.75,
  },
  tagline: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.9,
    textTransform: "uppercase",
  },
  cityLabel: {
    position: "absolute",
    bottom: 56,
    fontSize: 12,
    fontWeight: "500",
  },
});
