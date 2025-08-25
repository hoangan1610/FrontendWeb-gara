import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Footer, HeaderWithSideBar } from '../components/common';
import EnterOTPForRegist from '../pages/auth/regist/EnterOTP';
import EnterOTPForResetPassword from '../pages/auth/resetPassword/EnterOTP';
import {
    Login,
    Regist,
    Logout,
    PasswordResetPage,
    EnterNewPassword,
    NotFound,
} from '../pages';

const LoginRoute = () => {
    return (
        <>
            <HeaderWithSideBar />
            <Routes>
                <Route path='login' element={<Login />} />
                <Route path='regist' element={<Regist />} />
                <Route path='regist/enter-otp' element={<EnterOTPForRegist />} />
                <Route path='logout' element={<Logout />} />
                <Route path='forgot-password' element={<PasswordResetPage />} />
                <Route path='enter-otp' element={<EnterOTPForResetPassword />} />
                <Route path='reset-password/*' element={<EnterNewPassword />} />
                <Route path='*' element={<NotFound />} />
            </Routes>
            <Footer />
        </>
    )
};

export default LoginRoute;
