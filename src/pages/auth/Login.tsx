import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import authService from "@/services/auth";
import { AxiosError } from "axios";
import acuvateLogo from "@/assets/acuvateLogo_dark.png";

export function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call backend authentication API
      const response = await authService.login({
        email: email.trim(),
        password,
      });

      // Login successful
      toast.success("Welcome!", {
        description: `Logged in as ${response.user.name}`,
      });

      // Store user in auth state (token is already stored in authService)
      login(response.user);
      navigate("/dashboard");
    } catch (error) {
      if (error instanceof AxiosError) {
        // Handle specific HTTP error codes
        if (error.response && error.response.status === 401) {
          toast.error("Invalid Credentials", {
            description:
              "The email address or password you entered is incorrect.",
          });
        } else if (error.response && error.response.status === 429) {
          toast.error("Too Many Attempts", {
            description: "Please wait a few minutes before trying again.",
          });
        } else if (error.response && error.response.status >= 500) {
          toast.error("Server Error", {
            description:
              "Our servers are experiencing issues. Please try again later.",
          });
        } else {
          toast.error("Login Failed", {
            description:
              error.response?.data?.message ||
              "An error occurred during login.",
          });
        }
      } else {
        toast.error("Login Failed", {
          description: "An error occurred during login. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Panel - 60% */}
      <div className="hidden md:flex md:w-[60%] bg-primary relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="absolute top-10 left-10 w-64 h-64"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#FFFFFF"
              d="M45.4,-77.7C58.8,-69.3,69.6,-56.9,77.8,-42.8C86,-28.7,91.6,-14.4,91.1,-0.2C90.6,14,83.9,28,75.4,40.8C66.9,53.6,56.6,65.2,43.8,72.4C31,79.6,15.5,82.4,0.5,81.5C-14.5,80.6,-29,76,-42.2,68.9C-55.4,61.8,-67.3,52.2,-75.8,39.4C-84.3,26.6,-89.4,10.6,-88.6,-5.1C-87.8,-20.8,-81.1,-36.2,-71.4,-48.8C-61.7,-61.4,-49,-71.2,-35.1,-79.3C-21.2,-87.4,-6,-93.8,7.6,-105.4C21.2,-117,32,-133.8,45.4,-77.7Z"
              transform="translate(100 100)"
            />
          </svg>
          <svg
            className="absolute bottom-10 right-10 w-96 h-96"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="#FFFFFF"
              d="M39.5,-66.3C51.4,-58.5,61.5,-48.3,68.4,-36.2C75.3,-24.1,79,-10.1,78.8,4.1C78.6,18.3,74.5,32.6,66.8,44.3C59.1,56,47.8,65.1,35.3,70.4C22.8,75.7,9.1,77.2,-4.8,75.5C-18.7,73.8,-32.8,68.9,-45.1,61.4C-57.4,53.9,-67.9,43.8,-74.2,31.4C-80.5,19,-82.6,4.3,-80.1,-9.5C-77.6,-23.3,-70.5,-36.2,-60.3,-46.4C-50.1,-56.6,-36.8,-64.1,-23.4,-71.3C-10,-78.5,3.4,-85.4,16.8,-86.1C30.2,-86.8,27.6,-74.1,39.5,-66.3Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-start justify-center px-12 py-16 text-white w-full">
          <div className="max-w-lg text-left space-y-8">
            {/* Star Icon */}
            <div className="w-20 h-20 flex items-center justify-center">
              <Sparkles className="w-20 h-20 text-white" strokeWidth={1.5} />
            </div>

            {/* Greeting */}
            <div className="space-y-4">
              <h1 className="font-semibold text-5xl leading-tight">
                Hello
                <br />
                Employee Connect! 👋
              </h1>

              <p className="text-lg text-white/90 leading-relaxed max-w-md">
                Streamline your HR operations, manage employee data, and enhance
                workplace productivity with our comprehensive employee
                management platform.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/70 text-sm">
              © {new Date().getFullYear()} Employee Connect. All rights
              reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - 40% */}
      <div className="w-full md:w-[40%] bg-card flex items-center justify-center px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-sm mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <img
              src={acuvateLogo}
              alt="Employee Connect"
              className="h-10 mx-auto mb-6"
            />
            <h2 className="font-semibold text-4xl leading-tight text-foreground">
              Welcome Back!
            </h2>
            <p className="text-muted-foreground text-sm">
              Don't have an account?{" "}
              <a
                href="#"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline"
              >
                Create a new account now
              </a>
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
                className="w-full px-0 py-2 text-foreground bg-transparent placeholder-muted-foreground border-0 border-b border-border focus:border-primary focus:ring-0 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Email address"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                  className="w-full px-0 py-2 pr-10 text-foreground bg-transparent placeholder-muted-foreground border-0 border-b border-border focus:border-primary focus:ring-0 focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1"
                  disabled={isLoading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Forgot password?{" "}
              </span>
              <a
                href="#"
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium hover:underline"
              >
                Click here
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black dark:bg-white text-white dark:text-black rounded-md py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <span className="mr-2">Signing in...</span>
                  <span className="animate-spin" aria-hidden="true">
                    ⏳
                  </span>
                </span>
              ) : (
                "Login Now"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400 font-medium">
                Or
              </span>
            </div>
          </div>

          {/* Microsoft Login Button */}
          <button
            type="button"
            onClick={() => {
              toast.info("Azure AD Integration", {
                description: "Microsoft login will be available soon.",
              });
            }}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md py-3 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center gap-3"
          >
            <svg className="h-5 w-5" viewBox="0 0 21 21" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            <span>Sign in with Microsoft</span>
          </button>
        </div>
      </div>
    </div>
  );
}
