import React, { useState, useContext, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-simple-toast';
import { ThemeContext } from '../context/ThemeContext';
import { getTheme } from '../context/theme';
import { verifyOTP, resendOTP, register } from '../service/AuthService';


const OTPVerificationScreen = ({ navigation, route }) => {
    const { darkTheme } = useContext(ThemeContext);
    const t = getTheme(darkTheme);

    const { email, formData } = route.params; // passed from SignupScreen

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    const inputRefs = useRef([]);

    // ─── Countdown timer ───────────────────────────────────────────────────────
    useEffect(() => {
        if (countdown === 0) {
            setCanResend(true);
            return;
        }
        const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown]);

    // ─── Handle single digit input ─────────────────────────────────────────────
    const handleChange = (text, index) => {
        if (!/^\d*$/.test(text)) return; // digits only

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        // Auto-focus next
        if (text && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // ─── Handle backspace ──────────────────────────────────────────────────────
    const handleKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    // ─── Handle paste (all 6 digits at once) ──────────────────────────────────
    const handlePaste = (text) => {
        const digits = text.replace(/\D/g, '').slice(0, 6).split('');
        if (digits.length === 6) {
            setOtp(digits);
            inputRefs.current[5]?.focus();
        }
    };

    // ─── Submit OTP ────────────────────────────────────────────────────────────
    const handleVerify = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) {
            Toast.show('Please enter the 6-digit code');
            return;
        }

        try {
            setLoading(true);
            const form = new FormData();
            form.append('email', formData.email);
            form.append('username', formData.username);
            form.append('password', formData.password);
            form.append('fullName', formData.fullName);

            if (formData.profileImage) {
                form.append('avatar', {
                    uri: formData.profileImage.uri,
                    type: formData.profileImage.type || 'image/jpeg',
                    name: 'avatar.jpg',
                });
            }
            const dataForOTP = {
                email: formData.email,
                otp: otpString
            }
            await verifyOTP(dataForOTP); 
            await register(form);
            
            Toast.show('Account created successfully!');
            navigation.replace('Login');
        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid or expired code';
            Toast.show(msg);
            // Clear OTP fields on failure
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    // ─── Resend OTP ────────────────────────────────────────────────────────────
    const handleResend = async () => {
        if (!canResend) return;
        try {
            setResendLoading(true);
            await resendOTP(email, 'verification');
            Toast.show('A new code has been sent to your email');
            setOtp(['', '', '', '', '', '']);
            setCountdown(60);
            setCanResend(false);
            inputRefs.current[0]?.focus();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to resend code';
            Toast.show(msg);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: t.background }]}
        >
            <View style={styles.inner}>

                {/* Back button */}
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-outline" size={24} color={t.textPrimary} />
                </TouchableOpacity>

                {/* Icon */}
                <View style={[styles.iconCircle, { backgroundColor: t.cardBg }]}>
                    <Icon name="mail-open-outline" size={48} color={t.link} />
                </View>

                {/* Heading */}
                <Text style={[styles.title, { color: t.textPrimary }]}>Verify your email</Text>
                <Text style={[styles.subtitle, { color: t.textSecondary }]}>
                    We sent a 6-digit code to
                </Text>
                <Text style={[styles.email, { color: t.link }]}>{email}</Text>

                {/* OTP Inputs */}
                <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                        <TextInput
                            key={index}
                            ref={(ref) => (inputRefs.current[index] = ref)}
                            style={[
                                styles.otpBox,
                                {
                                    backgroundColor: t.inputBg,
                                    borderColor: digit ? t.link : t.inputBorder,
                                    color: t.textPrimary,
                                },
                            ]}
                            value={digit}
                            onChangeText={(text) => {
                                // Handle paste scenario
                                if (text.length > 1) {
                                    handlePaste(text);
                                } else {
                                    handleChange(text, index);
                                }
                            }}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            keyboardType="number-pad"
                            maxLength={6} // allows paste
                            textAlign="center"
                            selectTextOnFocus
                        />
                    ))}
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: loading ? t.buttonDisabled : t.button },
                    ]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Verifying...' : 'Verify & Create Account'}
                    </Text>
                </TouchableOpacity>

                {/* Resend */}
                <View style={styles.resendRow}>
                    <Text style={[styles.resendText, { color: t.textSecondary }]}>
                        Didn't receive the code?{' '}
                    </Text>
                    {canResend ? (
                        <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
                            <Text style={[styles.resendLink, { color: t.link }]}>
                                {resendLoading ? 'Sending...' : 'Resend'}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.resendTimer, { color: t.textSecondary }]}>
                            Resend in {countdown}s
                        </Text>
                    )}
                </View>

            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    inner: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
    backButton: { position: 'absolute', top: 50, left: 24 },
    iconCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 15, textAlign: 'center' },
    email: { fontSize: 15, fontWeight: '600', marginBottom: 36 },
    otpRow: { flexDirection: 'row', gap: 10, marginBottom: 36 },
    otpBox: { width: 48, height: 56, borderRadius: 12, borderWidth: 2, fontSize: 22, fontWeight: '700' },
    button: { width: '100%', padding: 18, borderRadius: 12, alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
    resendText: { fontSize: 14 },
    resendLink: { fontSize: 14, fontWeight: '600' },
    resendTimer: { fontSize: 14 },
});

export default OTPVerificationScreen;