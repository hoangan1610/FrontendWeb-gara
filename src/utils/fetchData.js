import axios from 'axios';
import { updateToken } from '../redux/actions/authActions'; // Action để cập nhật token vào Redux
import { GLOBALTYPES } from '../redux/actions/globalTypes';

// Khai báo biến `dispatch` để lưu `dispatch` của Redux
let dispatch;

// Hàm setDispatch để inject `dispatch` từ Redux vào file này
export const setDispatch = (d) => {
    dispatch = d;
};

const server_url = process.env.REACT_APP_API_URL;
const axiosInstance = axios.create({
    baseURL: server_url,
});

// Thiết lập interceptor cho axiosInstance để xử lý lỗi 401 và refresh token tự động
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {

        if (error.code === "ERR_NETWORK") {
            dispatch({ type: GLOBALTYPES.SERVER_ERROR, payload: true });
        }

        const originalRequest = error.config;

        if ((error.response.status === 401) && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                localStorage.removeItem('access_token');
                const refresh_token = localStorage.getItem('refresh_token');
                if (!refresh_token) {
                    return Promise.reject(error);
                }

                const response = await axios.post(`${server_url}/auth/refresh-token`, { refresh_token });

                if (response.status !== 200) {
                    return Promise.reject(error);
                }

                const newToken = response.data.token;
                localStorage.setItem('access_token', `Bearer ${newToken}`);
                localStorage.setItem('refresh_token', `Bearer ${response.data.refresh_token}`);

                // Sử dụng dispatch để cập nhật token vào Redux
                if (dispatch) {
                    dispatch(updateToken(newToken));
                }

                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;

                return axiosInstance(originalRequest);
            } catch (err) {
                if (err.response.status === 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    if (dispatch) {
                        dispatch({ type: GLOBALTYPES.AUTH_ERROR, payload: true });
                    }
                }
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

// Các hàm API để gọi GET, POST, PUT, PATCH, DELETE
export const getDataAPI = async (url, token) => {
    // Sử dụng token từ parameter, fallback to localStorage
    const authToken = token || localStorage.getItem('access_token');
    
    const config = {};
    if (authToken) {
        config.headers = { Authorization: authToken };
    }
    
    const res = await axiosInstance.get(url, config);
    return res;
};

export const postDataAPI = async (url, post, token) => {
    // Sử dụng token từ parameter, fallback to localStorage
    const authToken = token || localStorage.getItem('access_token');
    
    const config = {};
    if (authToken) {
        config.headers = { Authorization: authToken };
    }
    
    console.log("postDataAPI debug:", {
        url,
        hasToken: !!authToken,
        tokenPreview: authToken ? authToken.substring(0, 20) + '...' : 'null'
    });
    
    const res = await axiosInstance.post(url, post, config);
    return res;
};

export const putDataAPI = async (url, put, token) => {
    const authToken = token || localStorage.getItem('access_token');
    
    const config = {};
    if (authToken) {
        config.headers = { Authorization: authToken };
    }
    
    const res = await axiosInstance.put(url, put, config);
    return res;
};

export const patchDataAPI = async (url, patch, token) => {
    const authToken = token || localStorage.getItem('access_token');
    
    const config = {};
    if (authToken) {
        config.headers = { Authorization: authToken };
    }
    
    const res = await axiosInstance.patch(url, patch, config);
    return res;
};

export const deleteDataAPI = async (url, token) => {
    const authToken = token || localStorage.getItem('access_token');
    
    const config = {};
    if (authToken) {
        config.headers = { Authorization: authToken };
    }
    
    const res = await axiosInstance.delete(url, config);
    return res;
};

// Thêm các functions riêng cho public endpoints (không cần token)
export const postPublicDataAPI = async (url, post) => {
    console.log("postPublicDataAPI - No auth header:", { url, post });
    const res = await axiosInstance.post(url, post);
    return res;
};

export const getPublicDataAPI = async (url) => {
    const res = await axiosInstance.get(url);
    return res;
};

export const fetchPublicKey = async () => {
    const response = await axiosInstance.get('/auth/public-key');
    return response.data.publicKey;
}

export default axiosInstance;
