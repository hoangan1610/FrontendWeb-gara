import { postDataAPI, getDataAPI } from "../../utils/fetchData"
import { CART_ACTION_TYPES, getCart } from "./cartActions";
import { GLOBALTYPES } from "./globalTypes";
import { getFollowingProducts, PRODUCT_ACTION_TYPES } from "./productActions";

export const AUTH_ACTION_TYPES = {
    LOGOUT: "LOGOUT",
}

export const updateToken = (newToken) => async (dispatch) => {
    dispatch({
        type: GLOBALTYPES.AUTH,
        payload: { token: newToken }
    })
}

export const login = (data) => async (dispatch) => {
    try {
        // Dispatch loading state
        dispatch({ type: GLOBALTYPES.LOADING, payload: true });

        console.log("Login data being sent:", data); // Debug: kiểm tra data gửi đi
        console.log("Email:", data.email);
        console.log("Password:", data.password);
        console.log("Password length:", data.password?.length);

        const res = await postDataAPI("auth/login", data);

        // Debug: Log toàn bộ response để kiểm tra cấu trúc
        console.log("Full response object:", res);
        console.log("Response status:", res.status);
        console.log("Response data:", res.data);
        console.log("Response headers:", res.headers);

        // Kiểm tra nhiều điều kiện có thể
        const isSuccessStatus = res.status === 200 || res.status === 201;
        const hasData = res.data;
        const hasToken = res.data?.access_token;
        const hasUser = res.data?.user;

        console.log("Status check:", isSuccessStatus);
        console.log("Has data:", hasData);
        console.log("Has token:", hasToken);
        console.log("Has user:", hasUser);

        if (isSuccessStatus && hasData && hasToken && hasUser) {
            // Dispatch auth success
            dispatch({
                type: GLOBALTYPES.AUTH,
                payload: { 
                    token: "Bearer " + res.data.access_token, 
                    user: res.data.user, 
                    role: res.data.user.role 
                }
            });

            // Clear cart và init following products
            dispatch({ type: CART_ACTION_TYPES.CLEAR_CART });
            dispatch({ type: PRODUCT_ACTION_TYPES.INIT_FOLLOWING_PRODUCTS });

            // Lưu vào localStorage
            localStorage.setItem("firstLogin", "true");
            localStorage.setItem("access_token", "Bearer " + res.data.access_token);
            
            if (res.data.refresh_token) {
                localStorage.setItem("refresh_token", "Bearer " + res.data.refresh_token);
            }

            // Hiển thị thông báo thành công
            dispatch({ 
                type: GLOBALTYPES.SUCCESS_ALERT, 
                payload: res.data.message || "Đăng nhập thành công!" 
            });

            // Clear loading
            dispatch({ type: GLOBALTYPES.LOADING, payload: false });

            return { success: true };
        } else {
            // Response không thành công - Debug chi tiết
            console.log("Login failed - analyzing response:");
            console.log("- Status success:", isSuccessStatus);
            console.log("- Has data:", hasData);
            console.log("- Has access_token:", hasToken);
            console.log("- Has user:", hasUser);
            
            let errorMessage = "Đăng nhập thất bại";
            
            if (res.data?.message) {
                errorMessage = res.data.message;
            } else if (!hasToken) {
                errorMessage = "Không nhận được token từ server";
            } else if (!hasUser) {
                errorMessage = "Không nhận được thông tin user từ server";
            }
            
            dispatch({ 
                type: GLOBALTYPES.ERROR_ALERT, 
                payload: errorMessage 
            });

            dispatch({ type: GLOBALTYPES.LOADING, payload: false });
            return { success: false, error: errorMessage };
        }
    } catch (err) {
        console.error("Login error details:", err);
        console.log("Error response:", err.response);
        console.log("Error request:", err.request);
        console.log("Error message:", err.message);

        // Clear loading
        dispatch({ type: GLOBALTYPES.LOADING, payload: false });

        // Xử lý các loại lỗi khác nhau
        let errorMessage = "Lỗi khi đăng nhập";

        if (err.response) {
            // Lỗi HTTP response
            const status = err.response.status;
            const data = err.response.data;

            console.log("HTTP Error - Status:", status);
            console.log("HTTP Error - Data:", data);

            switch (status) {
                case 400:
                    errorMessage = data.message || "Dữ liệu đăng nhập không hợp lệ";
                    break;
                case 401:
                    errorMessage = data.message || "Email hoặc mật khẩu không đúng";
                    break;
                case 404:
                    errorMessage = "Tài khoản không tồn tại";
                    break;
                case 403:
                    errorMessage = data.message || "Tài khoản chưa được kích hoạt";
                    break;
                case 422:
                    errorMessage = data.message || "Dữ liệu đầu vào không hợp lệ";
                    break;
                case 429:
                    errorMessage = "Quá nhiều lần thử. Vui lòng đợi một chút";
                    break;
                case 500:
                    errorMessage = "Lỗi máy chủ. Vui lòng thử lại sau";
                    break;
                default:
                    errorMessage = data.message || `Lỗi ${status}`;
            }
        } else if (err.request) {
            // Lỗi network
            console.log("Network Error - Request made but no response received");
            errorMessage = "Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng";
        } else if (err.message) {
            // Lỗi khác
            console.log("Other Error:", err.message);
            errorMessage = err.message;
        }

        dispatch({
            type: GLOBALTYPES.ERROR_ALERT,
            payload: errorMessage
        });

        return { success: false, error: errorMessage };
    }
};

export const regist = (data, setResult) => async (dispatch) => {
    try {


        const res = await postDataAPI("auth/regist", data)
        if (res.status === 200) {

            dispatch({ type: GLOBALTYPES.SUCCESS_ALERT, payload: res.data.message })
            dispatch({ type: GLOBALTYPES.REDIRECTING, payload: true })
        } else {
            dispatch({ type: GLOBALTYPES.ERROR_ALERT, payload: res.data.message })

        }
        setResult(res.data.message)
    } catch (err) {
        setResult(err.response.data.message)
        dispatch({
            type: GLOBALTYPES.ERROR_ALERT,
            payload: err.response.data.message
        })

    }
}

export const verifyEmail = ({ token, setIsLoading, setResult }) => async (dispatch) => {
    try {
        setIsLoading(true);
        const res = await getDataAPI(`auth/verify-email/${token}`);
        console.log(res)
        setResult(res.data.message);
        if (res.status === 201) {
            setIsLoading(false);
            dispatch({ type: GLOBALTYPES.SUCCESS_ALERT, payload: res.data.message });
            dispatch({ type: GLOBALTYPES.REDIRECTING, payload: true });
        } else {
            setIsLoading(false);
            dispatch({ type: GLOBALTYPES.ERROR_ALERT, payload: res.data.message });
        }
    } catch (err) {
        console.log(err)
        dispatch({ type: GLOBALTYPES.REDIRECTING, payload: true });
        dispatch({ type: GLOBALTYPES.ERROR_ALERT, payload: err.response.data.message });
        setResult(err.response.data.message);
        setIsLoading(false);
    }
}

export const logout = () => async (dispatch) => {
    try {
        localStorage.removeItem("firstLogin")
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("cart")
        localStorage.removeItem("following_items")
        dispatch({ type: AUTH_ACTION_TYPES.LOGOUT })
        dispatch({ type: PRODUCT_ACTION_TYPES.INIT_FOLLOWING_PRODUCTS })
        dispatch({ type: CART_ACTION_TYPES.CLEAR_CART })
    } catch (err) {
        console.log(err)
        dispatch({
            type: GLOBALTYPES.ERROR_ALERT,
            payload: err
        })
    }
}
export const getUserInfo = () => async (dispatch) => {
    const access_token = localStorage.getItem("access_token")
    try {
        const res = await getDataAPI("user/get-user-info", access_token)

        dispatch({
            type: GLOBALTYPES.AUTH,
            payload: { user: res.data }
        })
    } catch (err) {
        localStorage.removeItem("access_token")
    }
}

export const requestResetPassword = (data, setResult) => async (dispatch) => {
    try {
        const res = await postDataAPI("auth/request-reset-password", data, localStorage.getItem("access_token"))
        if (res.status === 200) {
            dispatch({ type: GLOBALTYPES.SUCCESS_ALERT, payload: res.data.message })
            setResult(res.data.message)
        } else {
            setResult(res.data.message)
            dispatch({ type: GLOBALTYPES.ERROR_ALERT, payload: res.data.message })
        }
    } catch (err) {
        setResult(err.response.data.message)
        dispatch({
            type: GLOBALTYPES.ERROR_ALERT,
            payload: err.response.data.message
        })
    }
}

export const resetPassword = (data, setResult) => async (dispatch) => {
    try {
        const res = await postDataAPI("auth/reset-password", data)
        if (res.status === 200) {
            dispatch({ type: GLOBALTYPES.SUCCESS_ALERT, payload: res.data.message })
            dispatch({ type: GLOBALTYPES.REDIRECTING, payload: true })
        } else {
            dispatch({ type: GLOBALTYPES.ERROR_ALERT, payload: res.data.message })
        }
        setResult(res.data.message)
    } catch (err) {
        setResult(err.response.data.message)
        dispatch({
            type: GLOBALTYPES.ERROR_ALERT,
            payload: err.response.data.message
        })

    }
}

export const syncCartAndFollowing = (cart_items, following_items, token) => async (dispatch) => {
    if (token) {
        try {
            await postDataAPI("cart/sync", { cart_items }, token)
            dispatch(getCart(token))
            await postDataAPI("follow/sync-follow", { following_items }, token)
            dispatch(getFollowingProducts(token))
        } catch (err) {
            dispatch({
                type: GLOBALTYPES.ERROR_ALERT,
                payload: err.response.data.message
            })
        }
    }
}

export const verifyResetPasswordOTP = (data, setResult) => async (dispatch) => {
    try {
        const res = await postDataAPI("auth/verify-reset-otp", data)
        if (res.status === 200) {
            dispatch({ type: GLOBALTYPES.SUCCESS_ALERT, payload: res.data.message })
            setResult({ success: true, message: res.data.message, token: res.data.token })
        } else {
            dispatch({ type: GLOBALTYPES.ERROR_ALERT, payload: res.data.message })
            setResult({ success: false, message: res.data.message })
        }
    } catch (err) {
        const errorMessage = err.response?.data?.message || "An error occurred"
        setResult({ success: false, message: errorMessage })
        dispatch({
            type: GLOBALTYPES.ERROR_ALERT,
            payload: errorMessage
        })
    }
}

export const verifyRegistOTP = (data) => async (dispatch) => {
    try {
        // Sử dụng postDataAPI thay vì fetch để đồng nhất với các action khác
        const res = await postDataAPI("auth/verify-register-otp", data);
        
        if (res.status === 200 && res.data.user && res.data.token) {
            // Trả về kết quả thành công
            return {
                success: true,
                user: res.data.user,
                token: "Bearer " + res.data.token, // Thêm Bearer prefix
                message: res.data.message
            };
        } else {
            // Trả về kết quả thất bại
            return {
                success: false,
                message: res.data.message || 'OTP verification failed'
            };
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        
        // Xử lý lỗi từ server
        let errorMessage = 'Network error occurred';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            success: false,
            message: errorMessage
        };
    }
};

export const resendOTPRegistration = (data) => async (dispatch) => {
    try {
        // Sử dụng postDataAPI thay vì fetch để đồng nhất
        const res = await postDataAPI("auth/resend-otp", data);
        
        if (res.status === 200) {
            return {
                success: true,
                message: res.data.message || 'OTP has been resent'
            };
        } else {
            return {
                success: false,
                message: res.data.message || 'Failed to resend OTP'
            };
        }
    } catch (error) {
        console.error('Resend OTP error:', error);
        
        let errorMessage = 'Network error occurred';
        if (error.response && error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return {
            success: false,
            message: errorMessage
        };
    }
};
