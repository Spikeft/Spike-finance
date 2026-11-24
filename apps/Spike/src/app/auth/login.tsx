import { View, Text } from 'react-native'
import React, { useMemo, useState } from 'react'
import useForm from '@/hooks/use-form'
import { phoneSchema, emailSchema } from '@spike/shared'
import CustomTextInput from '@/components/ui/custom-input'
import SubmitButton from '@/components/ui/submit-button'
import CustomButton from '@/components/ui/custom-button'
import { useCSSVariable } from 'uniwind'
import CustomPhoneInput from '@/components/ui/custom-phone-input'
import { useLogin } from '@/hooks/use-auth'
import { router } from 'expo-router'
import { useLoginState } from '@/states/login-state'

const Home = () => {
    // CSS Variables
    const backgroundColor = useCSSVariable('--color-gray-300');

    // states
    const [loginType, setLoginType] = useState<'EMAIL' | 'PHONE'>('EMAIL')
    const { setDetails } = useLoginState((state) => state)

    // hooks
    const { login, isPending, error, data: loginData } = useLogin()


    const schemaMemo = useMemo(() => {
        if (loginType === 'EMAIL') return emailSchema
        else return phoneSchema
    }, [loginType])

    const { renderForm } = useForm({
        defaultValues: {
            email: '',
            phone: '',
        },
        validationSchema: schemaMemo,

    })

    const toggleLoginType = () => {
        setLoginType(loginType === 'EMAIL' ? 'PHONE' : 'EMAIL')
    }

    // functions
    const handleLogin = async (data: { email?: string, phone?: string }) => {
        try {

            const response = await login({
                params: null,
                body: {
                    email: data.email,
                    phone: data.phone
                },
                query: {
                    type: loginType.toLowerCase()
                }
            });
            console.log(response.data);
            setDetails({
                email: data?.email,
                phone: data?.phone,
                type: loginType.toLowerCase() as 'email' | 'phone',
                identifier: data.email || data.phone || ''
            })
            router.push('/auth/otp-verification')
        } catch (error) {

        }
    }

    return renderForm(
        <View className='w-full h-full px-6 py-10 bg-white pt-20'>
            <Text className='font-figtree-medium text-black text-32 leading-[32.6px] tracking-[-1.0%]'>Welcome to SPIKE</Text>
            <Text className='font-inter-regular text-text-body text-sm'>Enter your phone number or email to continue</Text>
            {loginType === 'EMAIL' && (
                <CustomTextInput name={'email'} label={'Email'} placeholder={'example@mail.com'} className='font-figtree-medium text-black' containerClassName='mt-6' />
            )}
            {loginType === 'PHONE' && (
                <CustomPhoneInput name={'phone'} label={'Phone'} placeholder={'2348033948394'} className='font-figtree-medium text-black' containerClassName='mt-6' />
            )}
            <SubmitButton label='Continue' onSubmit={(data) => handleLogin(data)} isLoading={isPending} borderRadius={100} className='rounded-full mt-3' />
            <View className='flex-row justify-center items-center gap-2 h-4 mt-4'>
                <View className='flex-1 h-0.5 bg-gray-200' />
                <Text className='font-figtree-medium text-black'>OR</Text>
                <View className='flex-1 h-0.5 bg-gray-200' />
            </View>

            <CustomButton text={loginType === 'EMAIL' ? 'Use phone number' : 'Use email'} onPress={toggleLoginType} className='bg-gray-300 text-black mt-4' color={'black'} borderRadius={100} backgroundColor={backgroundColor as string} />

            <Text className='font-inter-regular text-text-body text-sm mt-4 text-center'>by continuing, you agree to SPIKE's <Text className='text-primary underline'>Terms of Service</Text> and acknowledge our <Text className='text-primary underline'>Privacy Policy</Text></Text>
        </View>
    )
}

export default Home