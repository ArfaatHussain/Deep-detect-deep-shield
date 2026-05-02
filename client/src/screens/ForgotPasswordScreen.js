import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, StatusBar, KeyboardAvoidingView,
    Platform, ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-simple-toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getTheme } from '../context/theme';
import { resendOTP, verifyOTP } from '../service/AuthService';
import { resetPassword } from '../service/userService';
import { loadUser } from '../utils/loadUser';

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEP_EMAIL = 1;   // Enter email → request OTP
const STEP_OTP = 2;   // Enter 6-digit OTP
const STEP_PASSWORD = 3;   // Enter new password

const ForgotPasswordScreen = ({ navigation }) => {
    const [darkTheme, setDarkTheme] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem('theme').then(v => setDarkTheme(v === 'dark')).catch(() => { });
    }, []);

    const t = getTheme(darkTheme);
    const accent = t.button || '#2563EB';
    const accent22 = accent + '22';

    // ─── Shared state ──────────────────────────────────────────────────────────
    const [step, setStep] = useState(STEP_EMAIL);
    const [email, setEmail] = useState('');
    const [focusedInput, setFocusedInput] = useState(null);
    const [loading, setLoading] = useState(false);

    // ─── OTP state ─────────────────────────────────────────────────────────────
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (step !== STEP_OTP) return;
        if (countdown === 0) { setCanResend(true); return; }
        const t = setTimeout(() => setCountdown(p => p - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown, step]);

    // ─── Password state ────────────────────────────────────────────────────────
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // ─── Step 1: Request OTP ───────────────────────────────────────────────────
    const handleRequestOTP = async () => {
        if (!email.trim()) { Toast.show('Please enter your email'); return; }

        try {
            setLoading(true);
            await resendOTP(email.trim(), 'forgot_password');
            setOtp(['', '', '', '', '', '']);
            setCountdown(60);
            setCanResend(false);
            setStep(STEP_OTP);
        } catch (error) {
            Toast.show(error.response?.data?.message || 'Failed to send code');
        } finally {
            setLoading(false);
        }
    };

    // ─── OTP handlers ──────────────────────────────────────────────────────────
    const handleOtpChange = (text, index) => {
        if (!/^\d*$/.test(text)) return;
        if (text.length > 1) {
            const digits = text.replace(/\D/g, '').slice(0, 6).split('');
            const filled = [...otp];
            digits.forEach((d, i) => { if (i < 6) filled[i] = d; });
            setOtp(filled);
            inputRefs.current[5]?.focus();
            return;
        }
        const next = [...otp];
        next[index] = text;
        setOtp(next);
        if (text && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleOtpKeyPress = ({ nativeEvent }, index) => {
        if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0)
            inputRefs.current[index - 1]?.focus();
    };

    // ─── Step 2: Verify OTP ────────────────────────────────────────────────────
    const handleVerifyOTP = async () => {
        const otpString = otp.join('');
        if (otpString.length < 6) { Toast.show('Please enter the 6-digit code'); return; }

        try {
            setLoading(true);
            await verifyOTP({ email: email.trim(), otp: otpString, purpose: 'forgot_password' });
            setStep(STEP_PASSWORD);
        } catch (error) {
            Toast.show(error.response?.data?.message || 'Invalid or expired code');
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
            setResending(true);
            await resendOTP(email.trim(), 'forgot_password');
            setOtp(['', '', '', '', '', '']);
            setCountdown(60);
            setCanResend(false);
            inputRefs.current[0]?.focus();
            Toast.show('A new code has been sent');
        } catch (error) {
            Toast.show(error.response?.data?.message || 'Failed to resend code');
        } finally {
            setResending(false);
        }
    };

    // ─── Step 3: Reset Password ────────────────────────────────────────────────
    const handleResetPassword = async () => {
        if (!newPassword || !confirmPassword) {
            Toast.show('Please fill both fields'); return;
        }
        if (newPassword !== confirmPassword) {
            Toast.show('Passwords do not match'); return;
        }

        try {
            setLoading(true);
            console.log("Before calling")
            await resetPassword({ email: email.trim(), newPassword });
            console.log("After calling reset password")
            Toast.show('Password reset successfully');
            navigation.replace('Login');
        } catch (error) {
            console.error("Error: ", error);
            Toast.show(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    // ─── Back handler ──────────────────────────────────────────────────────────
    const handleBack = () => {
        if (step === STEP_EMAIL) navigation.goBack();
        else setStep(s => s - 1);
    };

    // ─── Step meta ─────────────────────────────────────────────────────────────
    const stepMeta = {
        [STEP_EMAIL]: { icon: 'mail-outline', title: 'Forgot Password', subtitle: 'Enter your email and we\'ll send a verification code' },
        [STEP_OTP]: { icon: 'shield-checkmark-outline', title: 'Verify Email', subtitle: `We sent a 6-digit code to ${email}` },
        [STEP_PASSWORD]: { icon: 'lock-closed-outline', title: 'New Password', subtitle: 'Create a strong new password' },
    };
    const meta = stepMeta[step];

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: t.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}  // ← 'height' for Android
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
            <StatusBar
                barStyle={darkTheme ? 'light-content' : 'dark-content'}
                backgroundColor={t.background}
            />

            <ScrollView                              // ← ScrollView back
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {/* Step Indicator */}
                <View style={styles.stepRow}>
                    {[STEP_EMAIL, STEP_OTP, STEP_PASSWORD].map(s => (
                        <View key={s} style={styles.stepWrapper}>
                            <View style={[
                                styles.stepDot,
                                { backgroundColor: s <= step ? accent : t.inputBorder, width: s === step ? 24 : 8 },
                            ]} />
                        </View>
                    ))}
                </View>

                {/* Icon */}
                <View style={[styles.iconCircle, { backgroundColor: accent22 }]}>
                    <Icon name={meta.icon} size={40} color={accent} />
                </View>

                <Text style={[styles.title, { color: t.textPrimary }]}>{meta.title}</Text>
                <Text style={[styles.subtitle, { color: t.textSecondary }]}>{meta.subtitle}</Text>

                {/* ── STEP 1: Email ── */}
                {step === STEP_EMAIL && (
                    <>
                        <InputField
                            id="email" iconName="mail-outline" placeholder="Email address"
                            value={email} onChangeText={setEmail} keyboard="email-address"
                            accent={accent} t={t} focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        />
                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: loading ? t.buttonDisabled : accent }]}
                            onPress={handleRequestOTP} disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Verification Code</Text>}
                        </TouchableOpacity>
                    </>
                )}

                {/* ── STEP 2: OTP ── */}
                {step === STEP_OTP && (
                    <>
                        <View style={styles.otpRow}>
                            {otp.map((digit, index) => (
                                <TextInput
                                    key={index}
                                    ref={ref => (inputRefs.current[index] = ref)}
                                    style={[styles.otpBox, {
                                        backgroundColor: t.inputBg,
                                        borderColor: digit ? accent : t.inputBorder,
                                        color: t.textPrimary,
                                    }]}
                                    value={digit}
                                    onChangeText={text => handleOtpChange(text, index)}
                                    onKeyPress={e => handleOtpKeyPress(e, index)}
                                    keyboardType="number-pad"
                                    maxLength={6}
                                    textAlign="center"
                                    selectTextOnFocus
                                />
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: loading ? t.buttonDisabled : accent }]}
                            onPress={handleVerifyOTP} disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify Code</Text>}
                        </TouchableOpacity>

                        <View style={styles.resendRow}>
                            <Text style={[styles.resendText, { color: t.textSecondary }]}>Didn't receive it? </Text>
                            {canResend ? (
                                <TouchableOpacity onPress={handleResend} disabled={resending}>
                                    <Text style={[styles.resendLink, { color: accent }]}>{resending ? 'Sending...' : 'Resend'}</Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={[styles.resendText, { color: t.textSecondary }]}>Resend in {countdown}s</Text>
                            )}
                        </View>
                    </>
                )}

                {/* ── STEP 3: New Password ── */}
                {step === STEP_PASSWORD && (
                    <>
                        <InputField
                            id="newPassword" iconName="lock-closed-outline" placeholder="New password"
                            value={newPassword} onChangeText={setNewPassword}
                            secureEntry={!showNew} showToggle toggleSecure={() => setShowNew(p => !p)}
                            accent={accent} t={t} focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        />
                        <InputField
                            id="confirmPassword" iconName="lock-closed-outline" placeholder="Confirm new password"
                            value={confirmPassword} onChangeText={setConfirmPassword}
                            secureEntry={!showConfirm} showToggle toggleSecure={() => setShowConfirm(p => !p)}
                            accent={accent} t={t} focusedInput={focusedInput} setFocusedInput={setFocusedInput}
                        />

                        {confirmPassword.length > 0 && (
                            <View style={styles.matchRow}>
                                <Icon
                                    name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                                    size={16}
                                    color={newPassword === confirmPassword ? '#22C55E' : '#EF4444'}
                                />
                                <Text style={[styles.matchText, { color: newPassword === confirmPassword ? '#22C55E' : '#EF4444' }]}>
                                    {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: loading ? t.buttonDisabled : accent }]}
                            onPress={handleResetPassword} disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
                        </TouchableOpacity>
                    </>
                )}

                <TouchableOpacity onPress={() => navigation.replace('Login')}>
                    <Text style={[styles.loginLink, { color: t.textSecondary }]}>
                        Remember your password?{' '}
                        <Text style={{ color: accent, fontWeight: '600' }}>Sign In</Text>
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// ─── Input helper ──────────────────────────────────────────────────────────
// ── Put this ABOVE the ForgotPasswordScreen component, outside it ──
const InputField = ({ id, iconName, placeholder, value, onChangeText,
    secureEntry, toggleSecure, showToggle, keyboard = 'default',
    accent, t, focusedInput, setFocusedInput
}) => (
    <View style={[
        styles.inputContainer,
        { backgroundColor: t.inputBg, borderColor: focusedInput === id ? accent : t.inputBorder },
    ]}>
        <Icon
            name={iconName} size={20}
            color={focusedInput === id ? accent : t.iconColor}
            style={styles.icon}
        />
        <TextInput
            style={[styles.input, { color: t.textPrimary }]}
            placeholder={placeholder}
            placeholderTextColor={t.placeholder}
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={secureEntry}
            keyboardType={keyboard}
            autoCapitalize="none"
            onFocus={() => setFocusedInput(id)}
            onBlur={() => setFocusedInput(null)}
        />
        {showToggle && (
            <TouchableOpacity onPress={toggleSecure}>
                <Icon
                    name={secureEntry ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={!secureEntry ? accent : t.iconColor}
                />
            </TouchableOpacity>
        )}
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, paddingTop: 60 },
    backBtn: {
        alignSelf: 'flex-start', width: 40, height: 40,
        borderRadius: 12, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center', marginBottom: 32,
    },
    stepRow: { flexDirection: 'row', alignSelf: 'center', marginBottom: 36, gap: 6 },
    stepWrapper: { justifyContent: 'center', alignItems: 'center' },
    stepDot: { height: 8, borderRadius: 4 },
    iconCircle: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
        alignSelf: 'center', marginBottom: 24,
    },
    title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 10, letterSpacing: 0.3 },
    subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 36, lineHeight: 22 },
    inputContainer: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderRadius: 12,
        marginBottom: 16, paddingHorizontal: 16, height: 56,
        shadowColor: '#020617', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
    },
    icon: { marginRight: 12 },
    input: { flex: 1, fontSize: 16 },
    button: {
        padding: 18, borderRadius: 12,
        alignItems: 'center', marginTop: 8, marginBottom: 16,
        shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 28 },
    otpBox: {
        width: 46, height: 54, borderRadius: 12,
        borderWidth: 2, fontSize: 22, fontWeight: '700',
    },
    resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    resendText: { fontSize: 14 },
    resendLink: { fontSize: 14, fontWeight: '600' },
    matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: -8 },
    matchText: { fontSize: 13 },
    loginLink: { textAlign: 'center', fontSize: 15, marginTop: 8 },
});

export default ForgotPasswordScreen;