"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useVerifyGoogleLogin, GoogleVerifyResponseData } from "@/lib/apiClient"; // Import type from apiClient
import logger from "@/lib/logger"; // Import the logger
import { useDispatch, useSelector } from 'react-redux'; // Added useSelector
import { setAuthLoading, setAuthSuccess, setAuthError, clearAuth } from '@/lib/store/authSlice'; // Import Redux actions, added clearAuth
import { AppDispatch, RootState } from "@/lib/store/store"; // Import AppDispatch type, added RootState
import { Button } from "@/components/ui/button";

const COMPONENT_NAME = "HomePage";

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isFeaturesVisible, setIsFeaturesVisible] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [loginError, setLoginError] = useState<string | null>(null); // UI error message

  const verifyGoogleLoginMutation = useVerifyGoogleLogin();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get auth state from Redux
  const { isAuthenticated, userInfo, isLoading: authIsLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    logger.info(COMPONENT_NAME, "Component mounted.");
    return () => {
      logger.info(COMPONENT_NAME, "Component unmounted.");
    };
  }, []);

  // Simple animation trigger on component mount for initial elements
  useEffect(() => {
    logger.debug(COMPONENT_NAME, "Setting initial elements visibility to true.");
    setIsVisible(true);
  }, []);

  // Intersection Observer for Features section
  useEffect(() => {
    logger.debug(COMPONENT_NAME, "Setting up IntersectionObserver for Features section.");
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          logger.info(COMPONENT_NAME, "Features section is intersecting, setting visibility to true.");
          setIsFeaturesVisible(true);
          observer.unobserve(entry.target); // Stop observing once visible
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    const currentFeaturesRef = featuresRef.current;
    if (currentFeaturesRef) {
      observer.observe(currentFeaturesRef);
      logger.debug(COMPONENT_NAME, "IntersectionObserver started observing Features section.");
    }

    return () => {
      if (currentFeaturesRef) {
        observer.unobserve(currentFeaturesRef);
        logger.debug(COMPONENT_NAME, "IntersectionObserver stopped observing Features section.");
      }
    };
  }, []);

  const handleGoogleLoginSuccess = (credentialResponse: CredentialResponse) => {
    logger.info(COMPONENT_NAME, "Google login successful on client-side.");
    setLoginError(null); // Clear previous UI errors
    dispatch(setAuthLoading()); // Dispatch loading state
    if (credentialResponse.credential) {
      logger.debug(COMPONENT_NAME, "Received credential from Google, initiating backend verification.");
      verifyGoogleLoginMutation.mutate({ idToken: credentialResponse.credential });
    } else {
      const errorMsg = "Google login failed: No credential received from Google.";
      logger.error(COMPONENT_NAME, errorMsg, credentialResponse);
      dispatch(setAuthError(errorMsg)); // Dispatch error state
      setLoginError(errorMsg); // Show error in UI
    }
  };

  const handleGoogleLoginError = () => {
    const errorMsg = "Google login failed. Please try again.";
    logger.error(COMPONENT_NAME, "Google login failed on client-side (onError callback triggered).");
    dispatch(setAuthError(errorMsg)); // Dispatch error state
    setLoginError(errorMsg); // Show error in UI
    verifyGoogleLoginMutation.reset();
  };

  const handleLogout = () => {
    logger.info(COMPONENT_NAME, "User logging out from home page.");
    localStorage.removeItem('appToken');
    localStorage.removeItem('userInfo');
    dispatch(clearAuth());
    // Optional: router.push('/') or just let the UI update.
    // If already on home page, router.push('/') might not be necessary unless you want to force a re-render/state clear.
    setLoginError(null); // Clear any login errors
  };

  useEffect(() => {
    // No need to manage verifyGoogleLoginMutation.isPending here for Redux,
    // as setAuthLoading is dispatched before mutation.
    // We handle success and error states of the mutation.

    if (verifyGoogleLoginMutation.isSuccess) {
      const responseData = verifyGoogleLoginMutation.data;
      logger.info(COMPONENT_NAME, "Google verification mutation successful.", responseData);
      
      const appToken = responseData?.data?.token;
      const userInfo = responseData?.data; // This is GoogleVerifyResponseData

      if (appToken && userInfo) {
        // Store token in localStorage for apiClient interceptor and persistence
        localStorage.setItem('appToken', appToken);
        // Store userInfo in localStorage for rehydration by ReduxProvider
        localStorage.setItem('userInfo', JSON.stringify(userInfo)); 
        
        // Dispatch success to Redux
        dispatch(setAuthSuccess({ token: appToken, user: userInfo }));
        
        logger.info(COMPONENT_NAME, "App token and userInfo stored. Redirecting to /chat-bot. User data:", userInfo);
        router.push('/chat-bot');
      } else {
        const warnMsg = "Google verification successful but no app token or user info received. Please try again.";
        logger.warn(COMPONENT_NAME, warnMsg, responseData);
        dispatch(setAuthError(warnMsg));
        setLoginError(warnMsg);
      }
    }
    if (verifyGoogleLoginMutation.isError) {
      const error = verifyGoogleLoginMutation.error;
      // Type assertion for AxiosError if needed, or access error.message
      const errorMessage = (error as any)?.response?.data?.message || (error as Error)?.message || "Backend Google verification failed. Please try again later.";
      logger.error(COMPONENT_NAME, "Backend Google verification mutation failed:", errorMessage, error);
      dispatch(setAuthError(errorMessage));
      setLoginError(errorMessage);
    }
  }, [verifyGoogleLoginMutation.isSuccess, verifyGoogleLoginMutation.isError, verifyGoogleLoginMutation.data, router, dispatch]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) {
      const errorMsg = "Google Client ID is not configured. Google Login is disabled.";
      logger.error(COMPONENT_NAME, "Google Client ID (NEXT_PUBLIC_GOOGLE_CLIENT_ID) is not configured.");
      setLoginError(errorMsg); // Set UI error message
    } else {
      logger.debug(COMPONENT_NAME, "Google Client ID is configured.");
      // Optionally clear the error if it was previously set due to this specific issue
      // setLoginError(null); // Or only clear if current loginError is the config error.
    }
  }, [googleClientId]);


  return (
    <GoogleOAuthProvider clientId={googleClientId || "YOUR_GOOGLE_CLIENT_ID_FALLBACK"}>
      <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-secondary-100 overflow-x-hidden">
        {/* Header - Subtle slide in from top animation */}
        <header className={`container mx-auto px-4 py-6 flex justify-between items-center transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className="relative overflow-hidden rounded-md shadow-sm group">
              <Image
                src="/logo.png"
                alt="Banking University Logo"
                width={42}
                height={42}
                className="rounded-md shadow-sm transform transition-transform duration-500 group-hover:scale-110"
                priority
              />
              <div className="absolute inset-0 bg-primary-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-primary-700 font-bold text-xl">HUB Chat Bot</span>
              <span className="text-xs text-gray-600">Đại học Ngân hàng TP.HCM</span>
            </div>
          </div>
          <div className="flex flex-col gap-2 justify-end items-end">
            {authIsLoading ? (
              <div className="flex items-center justify-center h-[40px] w-[300px]"> {/* Adjust size to match GoogleLogin button */}
                <div className="w-5 h-5 border-t-2 border-b-2 border-primary-700 rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-primary-700">Loading...</span>
              </div>
            ) : isAuthenticated && userInfo ? (
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 p-2 border border-gray-300 rounded-lg bg-white shadow-sm">
                  <span className="text-sm font-medium text-gray-700">
                    Welcome, {userInfo.fullName || userInfo.username}!
                  </span>
                  <Button
                    variant="default"
                    size="sm"
                    className="ml-2 py-1.5 text-white bg-blue-600 hover:bg-blue-700"
                    onClick={() => { setLoginError(null); router.push('/chat-bot'); }}
                  >
                    Bắt đầu chat
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2 py-1.5 text-white bg-red-600 hover:bg-red-700"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : googleClientId ? (
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap={false} 
                shape="rectangular" 
                theme="outline" 
                size="large" 
                logo_alignment="left" 
                width="300px" 
              />
            ) : (
              <Button
                disabled
                variant="secondary" // Base variant
                className="w-[300px] h-[40px] px-6 py-3 bg-gray-400 text-white border border-gray-500 shadow-md rounded-lg hover:bg-gray-400 focus-visible:ring-offset-0 focus-visible:ring-0"
              >
                Đăng nhập với Google (Chưa cấu hình)
              </Button>
            )}
            {/* Show pending state for verifyGoogleLoginMutation specifically if it's different from general authIsLoading */}
            {verifyGoogleLoginMutation.isPending && !authIsLoading && (
              <div className="flex items-center mt-2">
                <div className="w-5 h-5 border-t-2 border-b-2 border-primary-700 rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-primary-700">Đang xác thực...</span>
              </div>
            )}
            {loginError && (
              <p className="mt-2 text-sm text-red-600">{loginError}</p>
            )}
          </div>

        </header>

        {/* Hero Section - Staggered fade in */}
        <main className="container mx-auto px-4 py-12 md:py-20 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className={`flex flex-col gap-6 md:w-1/2 transition-all duration-700 delay-100 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
            <div className="relative">
              <div className="absolute -left-6 -top-6 w-20 h-20 bg-primary-200 rounded-full opacity-30 animate-pulse"></div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight relative">
                Chào mừng đến với <span className="text-primary-700 relative inline-block">
                  Trợ lý ảo
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 15" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0,5 Q25,0 50,5 T100,5" fill="none" stroke="#800020" strokeWidth="2" opacity="0.3" strokeDasharray="100" strokeDashoffset="100" className="animate-draw-line"></path>
                  </svg>
                </span> trường Đại học Ngân hàng TP.HCM
              </h1>
            </div>

            <p className="text-gray-800 text-lg">
              Giải đáp mọi thắc mắc về chương trình học, thủ tục hành chính và các hoạt động
              của trường một cách nhanh chóng và chính xác.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 mt-6">
              <div className="flex flex-col">


              </div>

              <Button
                onClick={() => { setLoginError(null); router.push('/about'); }}
                variant="outline"
                className="gap-2 bg-white text-gray-800 border-gray-300 hover:bg-gray-50 px-6 py-3 rounded-lg transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md relative overflow-hidden group focus-visible:ring-offset-0 focus-visible:ring-0"
              >
                <span className="absolute inset-0 w-0 h-full bg-primary-50 transition-all duration-300 group-hover:w-full"></span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10 transform group-hover:rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="relative z-10">Tìm hiểu thêm</span>
              </Button>
            </div>

            <div className="mt-6 p-4 bg-accent-50 border-l-4 border-accent-600 rounded-lg shadow-sm transform transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-gray-800">
                  <span className="font-semibold text-accent-900">Mới:</span> Trợ lý ảo đã được cập nhật với thông tin mới nhất về kỳ thi học kỳ 2 năm học 2024-2025.
                </p>
              </div>
            </div>
          </div>

          <div className={`md:w-1/2 transition-all duration-700 delay-300 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0'}`}>
            <div className="relative">
              <div className="absolute -left-6 -top-6 w-72 h-72 bg-primary-200 rounded-full opacity-20 blur-3xl animate-blob"></div>
              <div className="absolute -right-6 -bottom-6 w-72 h-72 bg-accent-200 rounded-full opacity-20 blur-3xl animate-blob animation-delay-2000"></div>

              <div className="relative bg-white p-6 rounded-2xl shadow-lg border border-secondary-200 transform transition-all duration-300 hover:shadow-xl">
                <div className="absolute right-6 top-6 flex items-center gap-1 bg-primary-50 text-primary-700 rounded-full px-3 py-1 text-xs font-medium">
                  <span className="h-2 w-2 bg-primary-600 rounded-full animate-pulse"></span>
                  Trợ lý ảo
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transform transition-transform hover:scale-110 duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="p-4 bg-primary-50 rounded-lg rounded-tl-none text-gray-800 shadow-sm transform hover:-translate-y-0.5 transition-transform duration-300 typing-effect">
                    <p>Xin chào! Tôi là trợ lý ảo của trường Đại học Ngân hàng TP.HCM.</p>
                    <p className="mt-1">Bạn cần hỗ trợ gì?</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left p-4 bg-secondary-50 hover:bg-secondary-100 border-secondary-100 rounded-lg text-gray-800 transition-all duration-300 hover:shadow-md flex items-center transform hover:-translate-y-0.5 group focus-visible:ring-offset-0 focus-visible:ring-0"
                  >
                    Thông tin về chương trình học?
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left p-4 bg-secondary-50 hover:bg-secondary-100 border-secondary-100 rounded-lg text-gray-800 transition-all duration-300 hover:shadow-md flex items-center transform hover:-translate-y-0.5 group focus-visible:ring-offset-0 focus-visible:ring-0"
                  >
                    Lịch thi học kỳ 2?
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features - Fade up on scroll */}
        <section ref={featuresRef} className="container mx-auto px-4 py-16 mt-8">
          <h2 className={`text-3xl font-bold text-gray-900 text-center mb-4 transition-all duration-700 transform ${isFeaturesVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>Tính năng nổi bật</h2>
          <p className={`text-center text-gray-600 mb-12 max-w-2xl mx-auto transition-all duration-700 transform delay-150 ${isFeaturesVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Trợ lý ảo được phát triển với các công nghệ tiên tiến nhất, mang đến trải nghiệm hỗ trợ tốt nhất cho sinh viên
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className={`card hover:shadow-lg transition-all duration-500 border-t-4 border-primary-600 transform hover:-translate-y-2 hover:scale-105 delay-300 ${isFeaturesVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Trả lời thông minh</h3>
              <p className="text-gray-700">
                Trả lời chính xác các câu hỏi về quy chế, quy định và thủ tục hành chính của trường dựa trên dữ liệu cập nhật liên tục.
              </p>
            </div>

            <div className={`card hover:shadow-lg transition-all duration-500 border-t-4 border-primary-600 transform hover:-translate-y-2 hover:scale-105 delay-500 ${isFeaturesVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Hỗ trợ 24/7</h3>
              <p className="text-gray-700">
                Hoạt động liên tục 24/7, sẵn sàng hỗ trợ sinh viên mọi lúc mọi nơi, không giới hạn về thời gian và không gian.
              </p>
            </div>

            <div className={`card hover:shadow-lg transition-all duration-500 border-t-4 border-primary-600 transform hover:-translate-y-2 hover:scale-105 delay-700 ${isFeaturesVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'}`}>
              <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mb-5 shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white animate-bounce-gentle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Thông tin cập nhật</h3>
              <p className="text-gray-700">
                Luôn được cập nhật thông tin mới nhất về các hoạt động, sự kiện và quy định mới của nhà trường.
              </p>
            </div>
          </div>
        </section>

        {/* Footer - Fade in */}
        <footer className={`bg-white border-t border-secondary-200 py-8 mt-16 transition-all duration-700 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center gap-3 mb-4 md:mb-0 group">
                <div className="overflow-hidden rounded-md">
                  <Image
                    src="/logo.png"
                    alt="Banking University Logo"
                    width={32}
                    height={32}
                    className="rounded-sm transform transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-medium">
                    © {new Date().getFullYear()} Trường Đại học Ngân hàng TP. Hồ Chí Minh
                  </p>
                  <p className="text-xs text-gray-500">
                    36 Tôn Thất Đạm, Phường Nguyễn Thái Bình, Quận 1, TP.HCM
                  </p>
                </div>
              </div>
              <div className="flex gap-8">
                <a href="#" className="text-sm text-gray-700 hover:text-primary-700 transition-colors relative group">
                  <span>Điều khoản sử dụng</span>
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary-700 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#" className="text-sm text-gray-700 hover:text-primary-700 transition-colors relative group">
                  <span>Chính sách bảo mật</span>
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary-700 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a href="#" className="text-sm text-gray-700 hover:text-primary-700 transition-colors relative group">
                  <span>Liên hệ</span>
                  <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-primary-700 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </GoogleOAuthProvider>
  );
}
