import React from 'react';
import { Text, View } from 'react-native';

export default function NotificationPreviewCard() {
    return (
        <View className="w-full items-center">
            {/* Main notification card */}
            <View
                className="w-full bg-white rounded-[24px] px-3.5 py-3 flex-row items-center gap-3 border border-gray-200 z-10"
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.08,
                    shadowRadius: 12,
                    elevation: 3,
                }}
            >
                {/* Spike green icon mark */}
                <View className="w-10 h-10 rounded-[10px] bg-[#38DC38] items-center justify-center">
                    <Text className="font-figtree-bold text-xl text-black">K</Text>
                </View>

                <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                        <Text className="font-figtree-bold text-[15px] text-text-black">
                            Money received!
                        </Text>
                        <Text className="font-inter-regular text-xs text-text-body">
                            2m ago
                        </Text>
                    </View>
                    <Text
                        numberOfLines={1}
                        className="font-inter-regular text-[14px] text-text-black mt-0.5"
                    >
                        You&apos;ve received ₦25,000 from David Okafor.
                    </Text>
                </View>
            </View>

            {/* Stacked collapsed card peek underneath */}
            <View className="w-[92%] h-2.5 bg-white/90 rounded-b-[20px] border-x border-b border-gray-200 -mt-1" />
        </View>
    );
}
