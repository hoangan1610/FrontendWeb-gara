import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { BiLoaderAlt } from "react-icons/bi";
import { verifyRegistOTP, resendOTPRegistration } from "../../../redux/actions/authActions";
import { GLOBALTYPES } from "../../../redux/actions/globalTypes";

const EnterOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resendCooldown, setResendCooldown] = useState(0);
    
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const inputRefs = useRef([]);
    
    const email = location.state?.email;

    useEffect(() => {
        // Nếu không có email từ state, chuyển về regist
        if (!email) {
            navigate('/auth/regist');
        }
    }, [email, navigate]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setTimeout(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [resendCooldown]);

    const handleInputChange = (index, value) => {
        if (value.length > 1) return;
        
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError('');

        // Auto focus next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text/plain');
        const pastedDigits = pastedData.replace(/\D/g, '').slice(0, 6);
        
        const newOtp = [...otp];
        for (let i = 0; i < pastedDigits.length; i++) {
            newOtp[i] = pastedDigits[i];
        }
        setOtp(newOtp);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');
        
        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        try {
            // Callback để xử lý kết quả từ action
            const handleVerifyResult = (result) => {
                if (result.success && result.token) {
                    dispatch({ type: GLOBALTYPES.AUTH, payload: {user: result.user, token: result.token } });
                    dispatch({ type: GLOBALTYPES.REDIRECTING, payload: true});
                } else {
                    setError(result.message || 'Invalid OTP code');
                }
                setLoading(false);
            };
            
            // Verify OTP với callback
            dispatch(verifyRegistOTP({ email, otp: otpCode }, handleVerifyResult));
        } catch (error) {
            setError('An error occurred. Please try again.');
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (resendCooldown > 0) return;
        
        setResendCooldown(60);
        try {
            // Callback để xử lý kết quả resend
            const handleResendResult = (result) => {
                if (!result.success) {
                    console.error('Resend OTP failed:', result.message);
                }
            };
            
            // Gửi lại OTP
            dispatch(resendOTPRegistration({ email }, handleResendResult));
        } catch (error) {
            console.error('Resend OTP failed:', error);
        }
    };
    useEffect(() => {
        // Focus vào ô đầu tiên khi component mount
        inputRefs.current[0]?.focus();
    }, []);

    if (!email) {
        return null; // Component sẽ redirect về forgot-password
    }

    return (
        <div className="min-h-[70vh] w-full flex items-center justify-center bg-gradient-to-br from-[--primary-background-color] to-[--tertiary-background-color] p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify OTP</h2>
                    <p className="text-gray-600 mb-2">
                        We've sent a 6-digit code to
                    </p>
                    <p className="text-blue-600 font-medium">{email}</p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div className="flex justify-center space-x-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={handlePaste}
                                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                autoComplete="off"
                            />
                        ))}
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm text-center">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <BiLoaderAlt className="animate-spin h-5 w-5" />
                        ) : (
                            "Verify Code"
                        )}
                    </button>
                </form>

                <div className="text-center">
                    <p className="text-gray-600 text-sm mb-2">
                        Didn't receive the code?
                    </p>
                    <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendCooldown > 0}
                        className="text-blue-600 hover:text-blue-500 font-medium transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {resendCooldown > 0 
                            ? `Resend in ${resendCooldown}s` 
                            : "Resend Code"
                        }
                    </button>
                </div>

                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/auth/forgot-password')}
                        className="text-gray-600 hover:text-gray-500 font-medium transition-colors"
                    >
                        ← Back to Email
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EnterOTP;