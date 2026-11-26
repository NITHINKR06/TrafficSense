import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../providers/auth-provider";
import { useTheme } from "../../theme/theme-provider";
import { motion, size as sizes } from "../../theme/tokens";
import { Icon, type IconName } from "./Icon";

export type NavTab = "home" | "map" | "report" | "plan" | "me" | "authority";

type BottomNavProps = {
  activeTab: NavTab;
  badgeCount?: number;
  compact?: boolean;
};

type TabDef = {
  id: "home" | "map" | "plan" | "me";
  label: string;
  icon: IconName;
  a11y: string;
};

export function BottomNav({ activeTab, badgeCount, compact = false }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const { session, role } = useAuth();
  const { colors, isDark, shadows, reduceMotion } = useTheme();

  const isAuthority =
    role === "authority" ||
    Boolean(session?.user?.email?.toLowerCase().includes("authority"));

  const activeId: "home" | "map" | "plan" | "me" =
    activeTab === "authority" ? "me" : activeTab === "report" ? "home" : activeTab;

  const tabs: TabDef[] = [
    { id: "home", label: "Home", icon: "house", a11y: "Home" },
    { id: "map", label: "Map", icon: "map", a11y: "Live map" },
    { id: "plan", label: "Plan", icon: "route", a11y: "Plan route" },
    {
      id: "me",
      label: isAuthority ? "Ops" : "Me",
      icon: isAuthority ? "shield-check" : "user-round",
      a11y: isAuthority ? "Control room" : "Me",
    },
  ];

  // Keep 284pt on 390pt+ screens; shrink proportionally only on very narrow viewports
  const availableForCapsule = Math.min(sizes.navWidth, screenWidth - 32 - 10 - sizes.reportAction);
  const tabWidth = Math.floor((availableForCapsule - 10) / 4);
  const capsuleWidth = tabWidth * 4 + 10;

  const activeIndex = Math.max(0, tabs.findIndex((t) => t.id === activeId));
  const [indicatorX] = useState(() => new Animated.Value(activeIndex * tabWidth));
  const [compactAnim] = useState(() => new Animated.Value(compact ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      indicatorX.setValue(activeIndex * tabWidth);
      return;
    }
    Animated.timing(indicatorX, {
      toValue: activeIndex * tabWidth,
      duration: motion.duration.sheet,
      easing: motion.easing.glide,
      useNativeDriver: true,
    }).start();
  }, [activeIndex, tabWidth, indicatorX, reduceMotion]);

  useEffect(() => {
    if (reduceMotion) {
      compactAnim.setValue(compact ? 1 : 0);
      return;
    }
    Animated.timing(compactAnim, {
      toValue: compact ? 1 : 0,
      duration: compact ? motion.duration.fade : motion.duration.base,
      easing: motion.easing.standard,
      useNativeDriver: false,
    }).start();
  }, [compact, compactAnim, reduceMotion]);

  const handleNavigate = (tabId: "home" | "map" | "plan" | "me" | "report") => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(
        tabId === "report"
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light,
      ).catch(() => {});
    }

    switch (tabId) {
      case "home":
        if (activeTab !== "home") router.replace("/");
        break;
      case "map":
        if (activeTab !== "map") router.replace("/traffic");
        break;
      case "plan":
        if (activeTab !== "plan") router.replace("/planner");
        break;
      case "report":
        router.push("/report");
        break;
      case "me":
        if (session) {
          if (isAuthority) {
            if (activeTab !== "authority") router.replace("/authority");
          } else {
            if (activeTab !== "me") router.replace("/workspace");
          }
        } else {
          router.push("/auth/login");
        }
        break;
    }
  };

  const bottomOffset = Math.max(insets.bottom, 12) + 8;
  const capsuleHeight = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sizes.navHeight, 52],
  });
  const indicatorHeight = compactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [sizes.navTabHeight, 42],
  });

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: bottomOffset }]}>
      <Animated.View
        style={[
          styles.capsuleShadowWrap,
          {
            width: capsuleWidth,
            height: capsuleHeight,
          },
          shadows.nav,
        ]}
      >
        <BlurView
          intensity={20}
          tint={isDark ? "dark" : "light"}
          style={[
            styles.capsule,
            {
              backgroundColor: colors.navGlass,
              borderColor: colors.navEdge,
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.indicator,
              {
                width: tabWidth,
                height: indicatorHeight,
                backgroundColor: colors.navIndicator,
                transform: [{ translateX: indicatorX }],
              },
            ]}
          />

          {tabs.map((tab) => {
            const isSelected = tab.id === activeId && activeTab !== "report";
            const fg = isSelected ? colors.navText : colors.navTextInactive;

            return (
              <Pressable
                key={tab.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={tab.a11y}
                onPress={() => handleNavigate(tab.id)}
                style={({ pressed }) => [
                  styles.tabButton,
                  {
                    width: tabWidth,
                    transform: pressed ? [{ scale: 0.9 }] : undefined,
                  },
                ]}
              >
                <View style={styles.iconWrap}>
                  <Icon
                    name={tab.icon}
                    size={22}
                    color={fg}
                    strokeWidth={isSelected ? 2.1 : 1.8}
                  />
                  {tab.id === "me" && isAuthority && badgeCount && badgeCount > 0 ? (
                    <View style={[styles.badgeDot, { backgroundColor: colors.danger }]} />
                  ) : null}
                </View>
                {!compact ? (
                  <Text
                    style={[
                      styles.tabLabel,
                      {
                        color: fg,
                        fontWeight: isSelected ? "600" : "500",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </BlurView>
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Report a hazard"
        onPress={() => handleNavigate("report")}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: pressed ? colors.accentPressed : colors.accent,
            transform: pressed ? [{ scale: 0.9 }] : undefined,
          },
          shadows.fab,
        ]}
      >
        <Icon name="plus" size={26} color={colors.onAccent} strokeWidth={2.2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 50,
  },
  capsuleShadowWrap: {
    borderRadius: 32,
  },
  capsule: {
    flex: 1,
    borderRadius: 32,
    borderWidth: 1,
    padding: 5,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    top: 5,
    left: 5,
    borderRadius: 26,
  },
  tabButton: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrap: {
    position: "relative",
  },
  tabLabel: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.11,
  },
  badgeDot: {
    position: "absolute",
    top: -1,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fab: {
    width: sizes.reportAction,
    height: sizes.reportAction,
    borderRadius: sizes.reportAction / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
