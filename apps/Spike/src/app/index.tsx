import { View, Text, StyleSheet, ViewStyle, useWindowDimensions } from 'react-native'
import React, { useEffect } from 'react'
import { Image, ImageSource } from 'expo-image'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import CustomButton from '@/components/ui/custom-button'
import { router } from 'expo-router'

interface FloatingImageProps {
  source: ImageSource
  style: ViewStyle
  distance?: number
  duration?: number
  delay?: number
}

const FloatingImage = ({
  source,
  style,
  distance = 8,
  duration = 2400,
  delay = 0,
}: FloatingImageProps) => {
  const translateY = useSharedValue(0)

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distance, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(distance, {
            duration,
            easing: Easing.inOut(Easing.sin),
          }),
        ),
        -1,
        true,
      ),
    )
  }, [delay, distance, duration, translateY])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Image
        source={source}
        contentFit='contain'
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

const Home = () => {
  const { width: WIDTH, height: HEIGHT } = useWindowDimensions()
  const stageSize = Math.min(WIDTH * 0.85, HEIGHT * 0.42)

  const rotation = useSharedValue(0)
  const scale = useSharedValue(1)
  const opacity = useSharedValue(0.85)

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 18000,
        easing: Easing.linear,
      }),
      -1,
      false,
    )

    scale.value = withRepeat(
      withSequence(
        withTiming(1.12, {
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.95, {
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    )

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.7, {
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
        }),
      ),
      -1,
      false,
    )
  }, [opacity, rotation, scale])

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }))

  return (
    <View className='w-full h-full bg-onboarding-bg'>
      <View
        style={{
          width: '100%',
          height: HEIGHT * 0.6,
          marginTop: 60,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Animated.View
          pointerEvents='none'
          style={[StyleSheet.absoluteFill, animatedBgStyle]}
        >
          <Image
            source={require('../../assets/images/lightbg.png')}
            contentFit='cover'
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <View className='w-full h-10 mt-4 items-center justify-center'>
          <Image source={require('../../assets/images/spikewhitelogo.svg')} contentFit='contain' style={{ width: 100, height: 100 }} />
        </View>

        <View className='flex-1 justify-center items-center'>
          <View style={{ width: stageSize, height: stageSize, position: 'relative' }}>
            {/* Main piggy bank */}
            <FloatingImage
              source={require('../../assets/images/onboarding assets/image 7.png')}
              distance={7}
              duration={2600}
              delay={0}
              style={{
                position: 'absolute',
                width: '84%',
                height: '84%',
                top: '8%',
                left: '8%',
              }}
            />

            {/* Top-left purple sparkles */}
            <FloatingImage
              source={require('../../assets/images/onboarding assets/image 8.png')}
              distance={10}
              duration={2200}
              delay={300}
              style={{
                position: 'absolute',
                width: '24%',
                height: '24%',
                top: '0%',
                left: '16%',
              }}
            />

            {/* Bottom-left blue arrow */}
            <FloatingImage
              source={require('../../assets/images/onboarding assets/image 9.png')}
              distance={9}
              duration={2500}
              delay={600}
              style={{
                position: 'absolute',
                width: '34%',
                height: '34%',
                bottom: '2%',
                left: '2%',
              }}
            />

            {/* Right orange Naira coin */}
            <FloatingImage
              source={require('../../assets/images/onboarding assets/image 10.png')}
              distance={11}
              duration={2350}
              delay={900}
              style={{
                position: 'absolute',
                width: '40%',
                height: '40%',
                top: '36%',
                right: '2%',
              }}
            />
          </View>
        </View>
      </View>

      <View className='w-full h-full items-center mt-4'>
        <Text className='text-white font-bold text-4xl text-center w-[80%]'>Send, save and manage your money in one place.</Text>

        <CustomButton text='Get Started' backgroundColor={'white'} width={'35%'} borderRadius={100} height={50} className='mt-6' color={'black'} onClick={() => router.push('/auth/login')} />
      </View>
    </View>
  )
}

export default Home
