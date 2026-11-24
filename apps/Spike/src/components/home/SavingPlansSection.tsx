import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image, ImageSource } from 'expo-image';

export interface SavingPlanItem {
  id: string;
  name: string;
  rate: string;
  image: ImageSource;
  imageWidth: number;
  imageHeight: number;
  isTopBanner?: boolean;
}

export const DEFAULT_SAVING_PLANS: SavingPlanItem[] = [
  {
    id: 'wedding-fund',
    name: 'Wedding Fund',
    rate: '8% p.a',
    image: require('@/assets/images/home/plan-wedding-fund.png'),
    imageWidth: 44,
    imageHeight: 44,
  },
  {
    id: 'professional-course',
    name: 'Professional Course',
    rate: '10% p.a',
    image: require('@/assets/images/home/plan-professional-course.png'),
    imageWidth: 44,
    imageHeight: 44,
  },
  {
    id: 'christmas-budget',
    name: 'Christmas Budget',
    rate: '10% p.a',
    image: require('@/assets/images/home/plan-christmas-budget.png'),
    imageWidth: 47,
    imageHeight: 44,
  },
  {
    id: 'home-setup',
    name: 'Home Setup',
    rate: '10% p.a',
    image: require('@/assets/images/home/plan-home-setup.png'),
    imageWidth: 44,
    imageHeight: 44,
  },
  {
    id: 'new-year-savings',
    name: 'New Year savings',
    rate: '10% p.a',
    image: require('@/assets/images/home/plan-professional-course.png'),
    imageWidth: 44,
    imageHeight: 44,
  },
  {
    id: 'emergency-funds',
    name: 'Emergency funds',
    rate: '10% p.a',
    image: require('@/assets/images/home/plan-emergency-funds.png'),
    imageWidth: 172,
    imageHeight: 96,
    isTopBanner: true,
  },
];

interface SavingPlansSectionProps {
  plans?: SavingPlanItem[];
  onPressHeader?: () => void;
  onPressPlan?: (plan: SavingPlanItem) => void;
}

export function SavingPlansSection({
  plans = DEFAULT_SAVING_PLANS,
  onPressHeader,
  onPressPlan,
}: SavingPlansSectionProps) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPressHeader}
        style={({ pressed }) => [styles.headerRow, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Saving plans"
      >
        <Image
          source={require('@/assets/images/home/icon-spa.svg')}
          contentFit="contain"
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Saving plans</Text>
        <View style={styles.chevronBox}>
          <Image
            source={require('@/assets/images/home/icon-chevron-right.svg')}
            contentFit="contain"
            style={styles.chevronIcon}
          />
        </View>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
      >
        {plans.map((plan) => (
          <Pressable
            key={plan.id}
            onPress={() => onPressPlan?.(plan)}
            style={({ pressed }) => [
              styles.card,
              plan.isTopBanner && styles.bannerCard,
              pressed && styles.cardPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${plan.name}, ${plan.rate}`}
          >
            {plan.isTopBanner ? (
              <Image
                source={plan.image}
                contentFit="cover"
                style={styles.bannerImage}
              />
            ) : (
              <View style={styles.planImageContainer}>
                <Image
                  source={plan.image}
                  contentFit="contain"
                  style={{ width: plan.imageWidth, height: plan.imageHeight }}
                />
              </View>
            )}

            <View style={styles.planDetails}>
              <Text style={styles.planName} numberOfLines={2}>
                {plan.name}
              </Text>
              <Text style={styles.planRate}>{plan.rate}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 26,
    alignSelf: 'flex-start',
  },
  headerIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    fontFamily: 'Figtree-Bold',
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.16,
    color: '#71717A',
  },
  chevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronIcon: {
    width: 16,
    height: 16,
  },
  carouselContent: {
    paddingHorizontal: 20,
    gap: 8,
    paddingVertical: 2,
  },
  card: {
    width: 172,
    height: 168,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 16,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  bannerCard: {
    justifyContent: 'flex-end',
  },
  bannerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 92,
  },
  planImageContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  planDetails: {
    gap: 8,
  },
  planName: {
    fontFamily: 'Figtree-Bold',
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.2,
    color: '#18181B',
    maxWidth: 128,
  },
  planRate: {
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.14,
    color: '#249824',
  },
  pressed: {
    opacity: 0.7,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
  },
});
